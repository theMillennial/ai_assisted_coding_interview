export interface Message {
  id: string;
  content: string;
  createdAt: string;
  created_at?: string;
}

export interface CreateMessageInput {
  content?: string;
}
