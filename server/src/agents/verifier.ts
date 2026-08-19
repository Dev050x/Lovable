import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { Sandbox } from "@e2b/code-interpreter";
import { VERIFIER_PROMPT } from "../system_prompt.js";
import { listAllFiles, readFile, searchFiles, writeFile } from "../tool.js";

export async function runVerifierAgent(
    plan: string,
    prompt: string,
    sandbox: Sandbox
) {
    console.log("[VerifierAgent] Starting automated code verification & self-repair phase...");

    const instruction = `
Task Context:
User Request: ${prompt}

Orchestrator Plan:
${plan}

Instruction:
1. Inspect /home/user/package.json using readFile to see installed dependencies.
2. Inspect /home/user/pages/index.tsx and all component files in /home/user/components/ using listAllFiles or readFile.
3. Verify there are no uninstalled package imports (e.g., 'prop-types', 'lucide-react', 'framer-motion', 'react-icons' if missing from package.json).
4. If an uninstalled package import or syntax mismatch is found, fix the file immediately using writeFile.
`;

    const result = await generateText({
        model: openai("gpt-4o-mini"),
        system: VERIFIER_PROMPT,
        messages: [{ role: "user", content: instruction }],
        tools: {
            writeFile: writeFile(sandbox),
            readFile: readFile(sandbox),
            searchFiles: searchFiles(sandbox),
            listAllFiles: listAllFiles(sandbox),
        },
        stopWhen: stepCountIs(5),
    });

    return result.text;
}
