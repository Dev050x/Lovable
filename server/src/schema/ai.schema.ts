import { string, z } from "zod";

export const promptSchema = z.object({
    prompt: z.string(),
});

export const generateSchema = z.object({
    projectId: z.string(),
    chatId: z.string(),
});

export const projectIdSchema = z.object({
    projectId: z.string(),
});

export const fileContentSchema = z.object({
    projectId: string(),
    path: string(),
})

export const updateProjectSchema = z.object({
    projectId: z.string(),
    prompt: z.string(),
})