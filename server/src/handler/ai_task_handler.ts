import "dotenv/config";
import { response, type Request, type Response } from "express";
import { generateText, stepCountIs, streamText } from "ai";
import { SYSTEM_PROMPT } from "../system_prompt.js";
import { createFile, deleteFile, readFile, updateFile } from "../tool.js";
import { Sandbox } from "@e2b/code-interpreter";
import { generateSchema, projectIdSchema, promptSchema } from "../schema/ai.schema.js";
import { groq } from "@ai-sdk/groq";
import { prisma } from "../utils/prisma.js";
import { ConversationType, MessageFrom, ProjectStatus } from "@prisma/client";
import { mapToolCallToChat, mapToolCallToEnum } from "../utils/ai_response.js";


export const create_project = async (req: Request, res: Response) => {
    const validatedData = promptSchema.safeParse(req.body);
    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            error: "Invalid Request Body"
        })
    };

    const { prompt } = validatedData.data;

    const sandbox = await Sandbox.create('nextjs-app');

    const { text } = await generateText({
        model: groq("openai/gpt-oss-120b"),
        messages: [
            { role: "system", content: "Just Give Me Suitable Simple(Not-Fancy) Project name nothing else and make it short" },
            { role: "user", content: prompt }
        ]
    });

    const project = await prisma.project.create({
        data: {
            title: text,
            SandboxId: sandbox.sandboxId,
        }
    });

    const chat = await prisma.conversationHistory.create({
        data: {
            projectId: project.id,
            content: prompt,
            from: MessageFrom.USER,
            type: ConversationType.TEXT_MESSAGE,
        }
    });

    res.status(200).json({
        projectId: project.id,
        chatId: chat.id,
    });

}


export const generateProject = async (req: Request, res: Response) => {

    const validatedData = generateSchema.safeParse(req.body);

    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            error: "Invalid Request Body"
        })
    };

    const { projectId, chatId } = validatedData.data;

    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        }
    });

    const chat = await prisma.conversationHistory.findUnique({
        where: {
            id: chatId,
        }
    });

    if (!project || !chat) {
        return res.status(404).json({
            success: false,
            error: "Project Not Found"
        })
    };

    const sandbox = await Sandbox.connect(project.SandboxId);
    const host = sandbox.getHost(3000);
    const url = `https://${host}`;

    const { textStream } = streamText({
        model: groq("openai/gpt-oss-120b"),

        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: chat.content },
        ],

        tools: {
            createFile: createFile(sandbox),
            updateFile: updateFile(sandbox),
            deleteFile: deleteFile(sandbox),
            readFile: readFile(sandbox),
        },

        stopWhen: stepCountIs(10),

        onFinish: async ({ steps }) => {
            console.log("length is: ", steps.length);

            await prisma.project.update({
                where: { id: projectId },
                data: { status: ProjectStatus.READY }
            });

            for (const step of steps) {
                for (const toolCall of step.toolCalls) {
                    const toolCallName = mapToolCallToEnum(toolCall.toolName);
                    let chat;
                    if (toolCall.input && typeof toolCall.input === "object" && "location" in toolCall.input) {
                        chat = mapToolCallToChat(toolCallName, toolCallName);
                    }
                    await prisma.conversationHistory.create({
                        data: {
                            projectId: projectId,
                            content: chat!,
                            from: MessageFrom.ASSISTANT,
                            type: ConversationType.TOOL_CALL,
                            tooolCall: toolCallName
                        }
                    })
                }

                if (step.text) {
                    await prisma.conversationHistory.create({
                        data: {
                            projectId: projectId,
                            content: step.text,
                            from: MessageFrom.ASSISTANT,
                            type: ConversationType.TEXT_MESSAGE,
                        }
                    })
                }
            }
        }

    });

    for await (const chunk of textStream) {

    }

    res.status(200).json({
        url: url
    })

}


export const getAllchats = async (req: Request, res: Response) => {
    let projectId = req.params.projectId;

    if (Array.isArray(projectId)) {
        projectId = projectId[0];
    }

    if (!projectId) {
        return res.status(400).json({ status: false, error: "Missing projectId" });
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { conversationHistory: { orderBy: { createdAt: "asc" } } }
    });
    console.log("projects is: ", project?.conversationHistory);

    return res.json({
        converSationHistory: project?.conversationHistory,
        projectStatus: project?.status,
        chatId: project?.conversationHistory[0]?.id,
    });
}

export const getProject = async (req: Request, res: Response) => {
    console.log("params: ", req.params.projectId);
    const validatedData = projectIdSchema.safeParse(req.params);

    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            error: "Invalid Request Body"
        })
    }

    const { projectId } = validatedData.data;

    const project = await prisma.project.findUnique({
        where: {
            id: projectId
        }
    });

    const url = `https://3000-${project?.SandboxId}.e2b.app`;

    return res.json({
        url,
    });

}