import "dotenv/config";
import { type Request, type Response } from "express";
import { generateText, stepCountIs, streamText } from "ai";
import { SYSTEM_PROMPT } from "../system_prompt.js";
import { askUser, createFile, deleteFile, readFile, updateFile } from "../tool.js";
import { Sandbox } from "@e2b/code-interpreter";
import {
    answerSchema,
    fileContentSchema,
    generateSchema,
    projectIdSchema,
    promptSchema,
    updateProjectSchema,
} from "../schema/ai.schema.js";
import { groq } from "@ai-sdk/groq";
import { prisma } from "../utils/prisma.js";
import { ConversationType, MessageFrom, ProjectStatus } from "@prisma/client";
import { getFileData, getFiles } from "../utils/sandbox_files.js";
import { getAuth } from "@clerk/express";
import { google } from "@ai-sdk/google";
import type { SseEvent } from "../types/types.js";
import { submitAnswer } from "../utils/peding_question.js";

export const create_project = async (req: Request, res: Response) => {
    try {
        const { userId } = await getAuth(req);

        const validatedData = promptSchema.safeParse(req.body);
        if (!validatedData.success) {
            return res.status(400).json({
                success: false,
                error: "Invalid Request Body",
            });
        }

        const { prompt } = validatedData.data;

        const sandbox = await Sandbox.create("nextjs-app");

        const { text } = await generateText({
            // model: groq("openai/gpt-oss-120b"),
            model: google("gemini-2.5-pro"),
            system: "Just Give Me Suitable Simple(Not-Fancy) Project name nothing else and make it short",
            messages: [{ role: "user", content: prompt }],
        });
        const user = await prisma.user.findUnique({
            where: {
                clerkId: userId!,
            },
        });

        const project = await prisma.project.create({
            data: {
                title: text,
                SandboxId: sandbox.sandboxId,
                Files: {},
                userId: user?.id!,
            },
        });

        const chat = await prisma.conversationHistory.create({
            data: {
                projectId: project.id,
                content: prompt,
                from: MessageFrom.USER,
                type: ConversationType.TEXT_MESSAGE,
            },
        });

        res.status(200).json({
            projectId: project.id,
            chatId: chat.id,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
            details: error,
        });
    }
};

export const generateProject = async (req: Request, res: Response) => {
    const validatedData = generateSchema.safeParse(req.body);

    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            error: "Invalid Request Body",
        });
    }

    const { projectId, chatId } = validatedData.data;

    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        },
    });

    const chat = await prisma.conversationHistory.findUnique({
        where: {
            id: chatId,
        },
    });

    if (!project || !chat) {
        return res.status(404).json({
            success: false,
            error: "Project Not Found",
        });
    }

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });

    const emit = (event: SseEvent) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const heartbeat = setInterval(() => res.write(": ping\n\n"), 15_000);
    try {
        const sandbox = await Sandbox.connect(project.SandboxId);
        const host = sandbox.getHost(3000);
        const url = `https://${host}`;
        emit({ type: "url", url  });

        const result = await generateText({
            model: google("gemini-2.5-pro"),
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: chat.content }],

            tools: {
                createFile: createFile(sandbox),
                updateFile: updateFile(sandbox),
                deleteFile: deleteFile(sandbox),
                readFile: readFile(sandbox),
                askUser: askUser(emit, projectId),
            },

            stopWhen: stepCountIs(10),

            onFinish: async ({ steps }) => {
                await prisma.project.update({
                    where: { id: projectId },
                    data: { status: ProjectStatus.READY },
                });

                for (const step of steps) {
                    if (step.text) {
                        await prisma.conversationHistory.create({
                            data: {
                                projectId: projectId,
                                content: step.text,
                                from: MessageFrom.ASSISTANT,
                                type: ConversationType.TEXT_MESSAGE,
                            },
                        });
                    }
                }
            },
        });
        emit({ type: "done" });
    } catch (error) {
        console.error("Error in generateProject:", error);
        emit({ type: "error", message: "Internal Server Error" });
    } finally {
        clearInterval(heartbeat);
        res.end();
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const validatedData = updateProjectSchema.safeParse(req.body);

        if (!validatedData.success) {
            return res.status(400).json({
                success: false,
                error: "Invalid Request Body",
            });
        }

        const { projectId, prompt } = validatedData.data;

        const project = await prisma.project.findUnique({
            where: {
                id: projectId,
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                error: "Project Not Found",
            });
        }

        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        });

        const emit = (event: SseEvent) => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        };

        const heartbeat = setInterval(() => res.write(": ping\n\n"), 15_000);

        try {
            await prisma.project.update({
                where: {
                    id: projectId,
                },
                data: {
                    status: ProjectStatus.UPDATING,
                },
            });

            const chat = await prisma.conversationHistory.create({
                data: {
                    projectId: projectId,
                    content: prompt,
                    from: MessageFrom.USER,
                    type: ConversationType.TEXT_MESSAGE,
                },
            });

            const sandbox = await Sandbox.connect(project.SandboxId);
            const host = sandbox.getHost(3000);
            const url = `https://${host}`;
            emit({ type: "url", url });

            const result = await generateText({
                model: google("gemini-2.5-pro"),
                system: SYSTEM_PROMPT,
                messages: [{ role: "user", content: prompt }],

                tools: {
                    createFile: createFile(sandbox),
                    updateFile: updateFile(sandbox),
                    deleteFile: deleteFile(sandbox),
                    readFile: readFile(sandbox),
                    askUser: askUser(emit, projectId),
                },

                stopWhen: stepCountIs(10),

                onFinish: async ({ steps }) => {
                    await prisma.project.update({
                        where: { id: projectId },
                        data: { status: ProjectStatus.READY },
                    });

                    for (const step of steps) {
                        if (step.text) {
                            await prisma.conversationHistory.create({
                                data: {
                                    projectId: projectId,
                                    content: step.text,
                                    from: MessageFrom.ASSISTANT,
                                    type: ConversationType.TEXT_MESSAGE,
                                },
                            });
                        }
                    }
                },
            });

            emit({ type: "done" });
        } catch (error) {
            console.error("Error in updateProject:", error);
            emit({ type: "error", message: "Internal Server Error" });
        } finally {
            clearInterval(heartbeat);
            res.end();
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
            details: error,
        });
    }
};

export const getAllchats = async (req: Request, res: Response) => {
    try {
        const validatedData = projectIdSchema.safeParse(req.query);

        if (!validatedData.success) {
            return res.status(400).json({
                success: false,
                error: "Invalid Request Body",
            });
        }

        const { projectId } = validatedData.data;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { conversationHistory: { orderBy: { createdAt: "asc" } } },
        });
        console.log("projects is: ", project?.conversationHistory);

        return res.json({
            converSationHistory: project?.conversationHistory,
            projectStatus: project?.status,
            chatId: project?.conversationHistory[0]?.id,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
            details: error,
        });
    }
};

export const getProjectUrl = async (req: Request, res: Response) => {
    try {
        console.log("params: ", req.params.projectId);
        const validatedData = projectIdSchema.safeParse(req.query);

        if (!validatedData.success) {
            return res.status(400).json({
                success: false,
                error: "Invalid Request Body",
            });
        }

        const { projectId } = validatedData.data;

        const project = await prisma.project.findUnique({
            where: {
                id: projectId,
            },
        });

        const url = `https://3000-${project?.SandboxId}.e2b.app`;

        return res.json({
            url,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
            details: error,
        });
    }
};

export const getAllFiles = async (req: Request, res: Response) => {
    try {
        console.log("request is received");
        console.log("request parama: ", req.query);
        const validatedData = projectIdSchema.safeParse(req.query);
        console.log("validated Data: ", validatedData);

        if (!validatedData.success) {
            return res.status(400).json({
                success: false,
                error: "Invalid Request Body",
            });
        }

        const { projectId } = validatedData.data;
        console.log("projectId is: ", projectId);

        const project = await prisma.project.findUnique({
            where: {
                id: projectId,
            },
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                error: "Project Not Found",
            });
        }

        const sandbox = await Sandbox.connect(project.SandboxId);
        const files = await getFiles(sandbox);
        console.log("files are: ", files);
        return res.json({
            files,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
            details: error,
        });
    }
};

export const getFileContent = async (req: Request, res: Response) => {
    try {
        console.log("request data", req.query);
        const validatedData = fileContentSchema.safeParse(req.query);

        if (!validatedData.success) {
            return res.status(400).json({
                success: false,
                error: "Invalid Request Body",
            });
        }

        const { projectId, path } = validatedData.data;

        const project = await prisma.project.findUnique({
            where: {
                id: projectId as string,
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                error: "Project Not Found",
            });
        }
        const sandbox = await Sandbox.connect(project.SandboxId);

        const fileContent = await getFileData(sandbox, path as string);

        return res.json({
            content: fileContent,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
            details: error,
        });
    }
};


export const answerQuestion = async (req: Request, res: Response) => {
  try {
    const validatedData = answerSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid Request Body",
      });
    }

    const { questionId, answer } = validatedData.data;

    const wasResolved = submitAnswer(questionId, answer);

    if (!wasResolved) {
      return res.status(404).json({
        success: false,
        error: "Question not found or already answered",
      });
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error,
    });
  }
};