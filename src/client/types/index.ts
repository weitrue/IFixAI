export interface Conversation {
  id: string;
  title: string;
  agent_type: string;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_url?: string;
  created_at: number;
}

export interface ApiKey {
  id: string;
  agent_type: 'gemini' | 'claude' | 'qwen';
  key_name: string;
  is_active: number;
  created_at: number;
}

