"use server"

const BASE_URL = "http://localhost:8080"

export async function creatProject(prompt: string) {
  const response = await fetch(`${BASE_URL}/api/project/create`, {
    method: "POST",
    body: JSON.stringify({
      prompt: prompt,
    }),
    headers: {
      'Content-type': "application/json",
    }
  });
  return response.json();
};


export async function getAllChats(id: string) {
  const response = await fetch(`${BASE_URL}/api/project/${id}/chats`);
  return response.json();
}

export async function generateProject(projectId: string, chatId: string) {
  const response = await fetch(`${BASE_URL}/api/project/generate`, {
    method: "POST",
    body: JSON.stringify({
      projectId,
      chatId
    }),
    headers: {
      'Content-type': "application/json"
    }
  });
  return response.json();
};
