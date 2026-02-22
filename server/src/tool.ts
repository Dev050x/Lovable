import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";

export const createFile = (sandbox: Sandbox) => ({
  description: "Create a file",
  inputSchema: z.object({
    location: z.string(),
    content: z.string(),
  }),
  execute: async ({ location, content }: { location: string; content: string }) => {
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
    const content = await sandbox.files.read(location);
    return content;
  },
});