import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { Sandbox } from "@e2b/code-interpreter";
import { ORCHESTRATOR_PROMPT } from "../system_prompt.js";
import { askUser, listAllFiles, readFile, searchFiles } from "../tool.js";
import type { SseEvent } from "../types/types.js";

export async function runOrchestratorAgent(
    prompt: string,
    sandbox: Sandbox,
    projectId: string,
    emit: (event: SseEvent) => void
) {
    console.log("[OrchestratorAgent] Starting planning phase...");

    const result = await generateText({
        model: openai("gpt-4o-mini"),
        system: ORCHESTRATOR_PROMPT,
        messages: [{ role: "user", content: prompt }],
        tools: {
            askUser: askUser(emit, projectId),
            listAllFiles: listAllFiles(sandbox),
            readFile: readFile(sandbox),
            searchFiles: searchFiles(sandbox),
        },
        stopWhen: stepCountIs(5),
    });

    return result.text;
}
