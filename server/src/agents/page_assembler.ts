import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { Sandbox } from "@e2b/code-interpreter";
import { PAGE_ASSEMBLER_PROMPT } from "../system_prompt.js";
import { listAllFiles, readFile, writeFile } from "../tool.js";

export async function runPageAssemblerAgent(
    plan: string,
    prompt: string,
    sandbox: Sandbox
) {
    console.log("[PageAssemblerAgent] Starting page assembly for /home/user/pages/index.tsx...");

    const instruction = `
Task Context:
User Request: ${prompt}

Orchestrator Plan:
${plan}

Instruction:
Inspect all component files in /home/user/components/ (using listAllFiles or readFile), import them into /home/user/pages/index.tsx, and write the complete main page using writeFile.
Ensure /home/user/pages/index.tsx has a valid default export (export default function Home() { ... }).
`;

    const result = await generateText({
        model: openai("gpt-4o-mini"),
        system: PAGE_ASSEMBLER_PROMPT,
        messages: [{ role: "user", content: instruction }],
        tools: {
            writeFile: writeFile(sandbox),
            readFile: readFile(sandbox),
            listAllFiles: listAllFiles(sandbox),
        },
        stopWhen: stepCountIs(5),
    });

    return result.text;
}
