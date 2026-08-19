import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import { waitForAnswer } from "./utils/peding_question.js";
import { randomUUID } from "crypto";
import type { SseEvent } from "./types/types.js";
import { prisma } from "./utils/prisma.js";
import { MessageFrom, ConversationType } from "@prisma/client";
import { getFiles } from "./utils/sandbox_files.js";

export const writeFile = (sandbox: Sandbox) => ({
  description:
    "Create a new file or overwrite an existing file with complete content",
  inputSchema: z.object({
    location: z.string().describe("Absolute file path"),
    content: z.string().describe("Complete file content"),
  }),
  execute: async ({
    location,
    content,
  }: {
    location: string;
    content: string;
  }) => {
    console.log(`[writeFile] -> ${location}`);
    await sandbox.files.write(location, content);
    return `File written successfully at ${location}`;
  },
});

export const deleteFile = (sandbox: Sandbox) => ({
  description: "Delete a file from the project",
  inputSchema: z.object({
    location: z.string().describe("Absolute file path"),
  }),
  execute: async ({ location }: { location: string }) => {
    console.log(`[deleteFile] -> ${location}`);
    await sandbox.files.remove(location);
    return `File deleted successfully at ${location}`;
  },
});

export const readFile = (sandbox: Sandbox) => ({
  description: "Read the complete contents of a file",
  inputSchema: z.object({
    location: z.string().describe("Absolute file path"),
  }),
  execute: async ({ location }: { location: string }) => {
    console.log(`[readFile] -> ${location}`);
    const content = await sandbox.files.read(location);
    return content;
  },
});

export const listAllFiles = (sandbox: Sandbox) => ({
  description: "List all files and directories in the project",
  inputSchema: z.object({}),
  execute: async () => {
    console.log("[listAllFiles]");
    const allFiles = await getFiles(sandbox);
    return allFiles;
  },
});

export const searchFiles = (sandbox: Sandbox) => ({
  description:
    "Search project files for a text pattern. Use this to locate code, imports, components, functions, errors, or configuration before reading files.",
  inputSchema: z.object({
    query: z.string().describe("Text or pattern to search for"),
    path: z.string().optional().describe("Directory or file to search inside"),
  }),
  execute: async ({ query, path }: { query: string; path?: string }) => {
    const searchPath = path ?? "/home/user";
    console.log(`[searchFiles] -> ${query} in ${searchPath}`);
    try {
      const result = await sandbox.commands.run(
        `grep -RIn --exclude-dir=node_modules --exclude-dir=.next ${JSON.stringify(query)} ${JSON.stringify(searchPath)} 2>/dev/null | head -200`,
        {
          timeoutMs: 10000,
        },
      );
      return result.stdout || "No matches found.";
    } catch (error) {
      console.error("[searchFiles] failed:", error);
      return "No matches found.";
    }
  },
});



const askUserInputSchema = z.object({
  question: z.string(),
  questionType: z.enum(["single", "multiple", "text"]).optional(),
  options: z.array(z.union([
    z.string(),
    z.object({
      value: z.string(),
      description: z.string().optional(),
    })
  ])).optional(),
  allowOther: z.boolean().optional(),
  otherLabel: z.string().optional(),
  score: z.number().optional(),
});

type AskUserInput = z.infer<typeof askUserInputSchema>;

export const askUser = (emit: (event: SseEvent) => void, projectId: string) => ({
  description: "Ask the user a clarifying question before proceeding",
  inputSchema: z.object({
    question: z.string(),
    questionType: z.enum(["single", "multiple", "text"]).optional().describe("Type of question: single choice, multiple choice, or plain text input"),
    options: z.array(z.union([
      z.string(),
      z.object({
        value: z.string(),
        description: z.string().optional().describe("Description under the option"),
      })
    ])).optional().describe("List of options, each can be a string or an object with value and description"),
    allowOther: z.boolean().optional().describe("Whether to show a text input for custom answers"),
    otherLabel: z.string().optional().describe("Label/placeholder for the other/custom text input"),
    score: z.number().optional().describe("Current project prompt score from 0-100%"),
  }),
  execute: async ({ question, questionType, options, allowOther, otherLabel, score }: AskUserInput) => {
    const questionId = randomUUID();
    console.log("question:", question, "type:", questionType, "options:", options, "allowOther:", allowOther, "score:", score);
    emit({
      type: "question",
      questionId,
      question,
      questionType: questionType ?? "single",
      options: options ?? null,
      allowOther: allowOther ?? (questionType === "text" ? true : false),
      otherLabel,
      score,
    });

    const answer = await waitForAnswer(questionId);

    try {
      const qaContent = `[QUESTION_ANSWER]:${JSON.stringify({ question, answer })}`;
      await prisma.conversationHistory.create({
        data: {
          projectId,
          content: qaContent,
          from: MessageFrom.ASSISTANT,
          type: ConversationType.TEXT_MESSAGE,
        },
      });
    } catch (err) {
      console.error("Failed to save Q&A history to database:", err);
    }

    return answer;
  },
});
