import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import { waitForAnswer } from "./utils/peding_question.js";
import { randomUUID } from "crypto";
import type { SseEvent } from "./types/types.js";
import { prisma } from "./utils/prisma.js";
import { MessageFrom, ConversationType } from "@prisma/client";

export const createFile = (sandbox: Sandbox) => ({
  description: "Create a file",
  inputSchema: z.object({
    location: z.string(),
    content: z.string(),
  }),
  execute: async ({ location, content }: { location: string; content: string }) => {
    console.log(`[createFile] -> ${location}`);
    await sandbox.files.write(location, content);
    return `File created at ${location}`;
  },
});

export const updateFile = (sandbox: Sandbox) => ({
  description: "Update a file",
  inputSchema: z.object({
    location: z.string(),
    content: z.string(),
  }),
  execute: async ({ location, content }: { location: string; content: string }) => {
    console.log(`[updateFile] -> ${location}`);
    await sandbox.files.write(location, content);
    return `File updated at ${location}`;
  },
});

export const deleteFile = (sandbox: Sandbox) => ({
  description: "Delete a file",
  inputSchema: z.object({
    location: z.string(),
  }),
  execute: async ({ location }: { location: string }) => {
    console.log(`[deleteFile] -> ${location}`);
    await sandbox.files.remove(location);
    return `File deleted at ${location}`;
  },
});

export const readFile = (sandbox: Sandbox) => ({
  description: "Read a file",
  inputSchema: z.object({
    location: z.string(),
  }),
  execute: async ({ location }: { location: string }) => {
    console.log(`[readFile] -> ${location}`);
    const content = await sandbox.files.read(location);
    return content;
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

