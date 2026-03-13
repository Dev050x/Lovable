"use server"
import { auth } from "@clerk/nextjs/server";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const getAuthHeaders = async () => {
  const { getToken } = await auth();
  const token = await getToken();
  return {
    "Authorization": `Bearer ${token}`,
    "Content-type": "application/json"
  }
};

export async function creatProject(prompt: string) {
  const response = await fetch(`${BASE_URL}/api/project/create`, {
    method: "POST",
    body: JSON.stringify({
      prompt: prompt,
    }),
    headers: await getAuthHeaders(),
  });
  return response.json();
};


export async function getAllChats(id: string) {
  const response = await fetch(`${BASE_URL}/api/project/chats?projectId=${id}`, {
    headers: await getAuthHeaders(),
  });
  return response.json();
}

export async function generateProject(projectId: string, chatId: string) {
  const response = await fetch(`${BASE_URL}/api/project/generate`, {
    method: "POST",
    body: JSON.stringify({
      projectId,
      chatId
    }),
    headers: await getAuthHeaders(),
  });
  return response.json();
};

export async function updateProject(projectId: string, prompt: string) {
  const response = await fetch(`${BASE_URL}/api/project/update`, {
    method: "POST",
    body: JSON.stringify({
      projectId,
      prompt
    }),
    headers: await getAuthHeaders(),
  })
  return response.json();
}

export async function getProject(projectId: string) {
  const response = await fetch(`${BASE_URL}/api/project/?projectId=${projectId}`, {
    headers: await getAuthHeaders(),
  });
  return response.json();
}

export async function getAllFiles(projectId: string) {
  const response = await fetch(`${BASE_URL}/api/project/files?projectId=${projectId}`, {
    headers: await getAuthHeaders(),
  });
  return response.json(); 
}

export async function getFileContent(projectId: string, path: string) {
  const response = await fetch(
    `${BASE_URL}/api/project/file?projectId=${projectId}&path=${encodeURIComponent(path)}`,
    {
      headers: await getAuthHeaders(),
    }
  );
  return response.json();
}


export async function syncUserInfo(token: string, userId: string) {
  const response = await fetch(`${BASE_URL}/api/auth/sync`, {
    method: "POST",
    headers: await getAuthHeaders(),
  });
  return response.json();
}