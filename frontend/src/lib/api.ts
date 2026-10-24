import { env } from "~/env";

export interface Message {
  id: string;
  content: string;
  createdAt: string;
}

const API_URL = env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { detail?: unknown } | null;
    const detail = typeof body?.detail === "string" ? body.detail : res.statusText;
    throw new Error(`Request failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as T;
}

export function getLatestMessages(limit = 10): Promise<Message[]> {
  return request<Message[]>(`/messages/latest?limit=${limit}`);
}

export function createMessage(content?: string): Promise<Message> {
  return request<Message>("/messages", {
    method: "POST",
    body: JSON.stringify(content === undefined ? {} : { content }),
  });
}
