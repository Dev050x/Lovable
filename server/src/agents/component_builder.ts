import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { Sandbox } from "@e2b/code-interpreter";
import { COMPONENT_BUILDER_PROMPT } from "../system_prompt.js";
import { readFile, searchFiles, writeFile } from "../tool.js";

export async function buildSingleComponent(
    componentName: string,
    spec: string,
    prompt: string,
    sandbox: Sandbox
) {
    console.log(`[ComponentBuilderAgent] Parallel sub-agent building component: ${componentName}...`);

    const instruction = `
Task Context:
User Request: ${prompt}
Component Specification for ${componentName}: ${spec}

Instruction:
Write the complete, modern React component code for ${componentName} directly into /home/user/components/${componentName} using writeFile.
Ensure it uses Tailwind CSS, has TypeScript props interface, and default export.
`;

    const result = await generateText({
        model: openai("gpt-4o-mini"),
        system: COMPONENT_BUILDER_PROMPT,
        messages: [{ role: "user", content: instruction }],
        tools: {
            writeFile: writeFile(sandbox),
            readFile: readFile(sandbox),
            searchFiles: searchFiles(sandbox),
        },
        stopWhen: stepCountIs(5),
    });

    return result.text;
}

export async function runParallelComponentBuilders(
    plan: string,
    prompt: string,
    sandbox: Sandbox
) {
    console.log("[ParallelComponentBuilders] Parsing plan for sub-agent component tasks...");

    const matches = Array.from(plan.matchAll(/([A-Z][a-zA-Z0-9]+\.tsx)/g))
        .map(m => m[1])
        .filter((c): c is string => typeof c === "string");
    const uniqueComponents = Array.from(new Set(matches));

    if (uniqueComponents.length === 0) {
        uniqueComponents.push("Header.tsx", "MainContent.tsx", "Footer.tsx");
    }

    console.log(`[ParallelComponentBuilders] Launching ${uniqueComponents.length} parallel builder sub-agents:`, uniqueComponents);

    const results = await Promise.all(
        uniqueComponents.map(compName =>
            buildSingleComponent(compName, `Build modular component ${compName} for ${prompt}`, prompt, sandbox)
        )
    );

    return results.join("\n\n");
}
