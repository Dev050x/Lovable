"use client";

import { SseEvent } from "./stream-types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function streamGenerate(
  endpoint: "generate" | "update",
  body: Record<string, unknown>,
  token: string,
  onEvent: (event: SseEvent) => void
) {
  const res = await fetch(`${BASE_URL}/api/project/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.body) throw new Error("No stream body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith("data:")) continue;
      try {
        onEvent(JSON.parse(line.slice("data:".length).trim()) as SseEvent);
      } catch {
        // ignore malformed frame
      }
    }
  }
}