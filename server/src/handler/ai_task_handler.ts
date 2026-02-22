import "dotenv/config";
import type { Request, Response } from "express";
import { stepCountIs, streamText } from "ai";
import { SYSTEM_PROMPT } from "../system_prompt.js";
import { createFile, deleteFile, readFile, updateFile } from "../tool.js";
import { Sandbox } from "@e2b/code-interpreter";
import { promptSchema } from "../schema/ai.schema.js";
import { groq } from "@ai-sdk/groq";


export const handleAiPrompt = async (req: Request, res: Response) => {

    const validatedData = promptSchema.safeParse(req.body);

    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            error: "Invalid Request Body"
        })
    };

    const { prompt } = validatedData.data;

    const sandbox = await Sandbox.create('nextjs-app');

    const {textStream} = streamText({
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

    });

    for await (const chunk of textStream) {
        // Optionally print or process chunk
    }

    const host = sandbox.getHost(3000);
    const url = `https://${host}`;

    res.status(200).json({
        url: url
    })
}