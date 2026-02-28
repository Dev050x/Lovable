import "dotenv/config";
import { response, type Request, type Response } from "express";
import { generateText, RetryError, stepCountIs, streamText } from "ai";
import { SYSTEM_PROMPT } from "../system_prompt.js";
import { createFile, deleteFile, readFile, updateFile } from "../tool.js";
import { Sandbox } from "@e2b/code-interpreter";
import { fileContentSchema, generateSchema, projectIdSchema, promptSchema, updateProjectSchema } from "../schema/ai.schema.js";
import { groq } from "@ai-sdk/groq";
import { prisma } from "../utils/prisma.js";
import { ConversationType, MessageFrom, ProjectStatus } from "@prisma/client";
import { getFileData, getFiles } from "../utils/sandbox_files.js";
import { fi } from "zod/locales";

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
            Files: {}
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
            await prisma.project.update({
                where: { id: projectId },
                data: { status: ProjectStatus.READY }
            });

            for (const step of steps) {
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

export const updateProject = async (req: Request, res: Response) => {
    const validatedData = updateProjectSchema.safeParse(req.body);

    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            error: "Invalid Request Body"
        })
    };

    const { projectId, prompt } = validatedData.data;

    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        }
    });

    await prisma.project.update({
        where: {
            id: projectId
        },
        data: {
            status: ProjectStatus.UPDATING
        }
    });

    if (!project) {
        return res.status(404).json({
            success: false,
            error: "Project Not Found"
        })
    };

    const chat = await prisma.conversationHistory.create({
        data: {
            projectId: projectId,
            content: prompt,
            from: MessageFrom.USER,
            type: ConversationType.TEXT_MESSAGE,
        }
    });

    const sandbox = await Sandbox.connect(project.SandboxId);
    const host = sandbox.getHost(3000);
    const url = `https://${host}`;

    const { textStream } = streamText({
        model: groq("openai/gpt-oss-120b"),

        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
        ],

        tools: {
            createFile: createFile(sandbox),
            updateFile: updateFile(sandbox),
            deleteFile: deleteFile(sandbox),
            readFile: readFile(sandbox),
        },

        stopWhen: stepCountIs(10),

        onFinish: async ({ steps }) => {
            await prisma.project.update({
                where: { id: projectId },
                data: { status: ProjectStatus.READY }
            });

            for (const step of steps) {
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
    const validatedData = projectIdSchema.safeParse(req.query);

    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            error: "Invalid Request Body"
        })
    }

    const { projectId } = validatedData.data;

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

export const getProjectUrl = async (req: Request, res: Response) => {
    console.log("params: ", req.params.projectId);
    const validatedData = projectIdSchema.safeParse(req.query);

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


export const getAllFiles = async (req: Request, res: Response) => {
    console.log("request is received");
    console.log("request parama: ", req.query);
    const validatedData = projectIdSchema.safeParse(req.query);
    console.log("validated Data: ", validatedData);

    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            error: "Invalid Request Body"
        })
    };

    const { projectId } = validatedData.data;
    console.log("projectId is: ", projectId);

    const project = await prisma.project.findUnique({
        where: {
            id: projectId
        }
    });
    if (!project) {
        return res.status(404).json({
            success: false,
            error: "Project Not Found"
        })
    };

    const sandbox = await Sandbox.connect(project.SandboxId);
    const files = await getFiles(sandbox);
    console.log("files are: ", files);
    return res.json({
        files
    });
}


export const getFileContent = async (req: Request, res: Response) => {
    console.log("request data", req.query);
    const validatedData = fileContentSchema.safeParse(req.query);

    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            error: "Invalid Request Body"
        })
    };

    const { projectId, path } = validatedData.data;

    const project = await prisma.project.findUnique({
        where: {
            id: projectId as string
        }
    });

    if (!project) {
        return res.status(404).json({
            success: false,
            error: "Project Not Found"
        })
    };
    const sandbox = await Sandbox.connect(project.SandboxId);

    const fileContent = await getFileData(sandbox, path as string);

    return res.json({
        content: fileContent
    })

}

