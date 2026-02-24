import { z } from "zod";

export const promptSchema = z.object({
    prompt: z.string(),
});

export const generateSchema = z.object({
    projectId: z.string(),
    chatId: z.string(),
});