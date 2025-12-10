import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { getDatabase, ApiKey } from '../models/database';

export type AgentType = 'gemini' | 'claude' | 'qwen' | 'gpt';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_url?: string;
}

export interface ChatResponse {
  content: string;
  error?: string;
}

// Get active API key for an agent
export function getActiveApiKey(agentType: AgentType): string | null {
  const db = getDatabase();
  const key = db
    .prepare('SELECT api_key FROM api_keys WHERE agent_type = ? AND is_active = 1 LIMIT 1')
    .get(agentType) as { api_key: string } | undefined;
  return key?.api_key || null;
}

// Get all active API keys for an agent (for rotation)
export function getActiveApiKeys(agentType: AgentType): string[] {
  const db = getDatabase();
  const keys = db
    .prepare('SELECT api_key FROM api_keys WHERE agent_type = ? AND is_active = 1')
    .all(agentType) as { api_key: string }[];
  return keys.map(k => k.api_key);
}

// Get available models for an agent from database
export function getAgentModels(agentType: AgentType): Array<{ value: string; label: string }> {
  const db = getDatabase();
  const models = db
    .prepare('SELECT model_value, model_label FROM agent_models WHERE agent_type = ? AND is_active = 1 ORDER BY display_order ASC, created_at ASC')
    .all(agentType) as Array<{ model_value: string; model_label: string }>;
  
  return models.map(m => ({ value: m.model_value, label: m.model_label }));
}

// Get default model for an agent
export function getDefaultModel(agentType: AgentType): string {
  const db = getDatabase();
  const model = db
    .prepare('SELECT model_value FROM agent_models WHERE agent_type = ? AND is_default = 1 AND is_active = 1 LIMIT 1')
    .get(agentType) as { model_value: string } | undefined;
  
  if (model) {
    return model.model_value;
  }
  
  // Fallback to first active model
  const firstModel = db
    .prepare('SELECT model_value FROM agent_models WHERE agent_type = ? AND is_active = 1 ORDER BY display_order ASC LIMIT 1')
    .get(agentType) as { model_value: string } | undefined;
  
  return firstModel?.model_value || '';
}

// Gemini Agent
export async function chatWithGemini(
  messages: ChatMessage[],
  apiKey?: string,
  model?: string
): Promise<ChatResponse> {
  try {
    const key = apiKey || getActiveApiKey('gemini');
    if (!key) {
      return { content: '', error: 'Gemini API key not configured' };
    }

    const genAI = new GoogleGenerativeAI(key);
    const modelName = model || 'gemini-2.0-flash-exp';
    const genModel = genAI.getGenerativeModel({ model: modelName });

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chat = genModel.startChat({ history });

    // Handle image if present
    if (lastMessage.image_url) {
      // For image input, we need to use generateContent with image
      const imageData = lastMessage.image_url; // base64 or URL
      const result = await genModel.generateContent([
        { text: lastMessage.content },
        {
          inlineData: {
            data: imageData.replace(/^data:image\/\w+;base64,/, ''),
            mimeType: 'image/jpeg',
          },
        },
      ]);
      const response = result.response;
      return { content: response.text() };
    }

    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;
    return { content: response.text() };
  } catch (error: any) {
    return { content: '', error: error.message || 'Gemini API error' };
  }
}

// Claude Agent
export async function chatWithClaude(
  messages: ChatMessage[],
  apiKey?: string,
  model?: string
): Promise<ChatResponse> {
  try {
    const key = apiKey || getActiveApiKey('claude');
    if (!key) {
      return { content: '', error: 'Claude API key not configured' };
    }

    const client = new Anthropic({ apiKey: key });

    // Convert messages to Claude format
    const systemMessages = messages.filter(m => m.role === 'system');
    const system = systemMessages.length > 0 ? systemMessages[0].content : undefined;
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

    const modelName = model || 'claude-3-5-sonnet-20241022';
    const response = await client.messages.create({
      model: modelName,
      max_tokens: 4096,
      system,
      messages: conversationMessages as any,
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return { content: content.text };
    }
    return { content: '', error: 'Unexpected response format' };
  } catch (error: any) {
    return { content: '', error: error.message || 'Claude API error' };
  }
}

// Qwen Code Agent (using OpenAI-compatible API)
export async function chatWithQwen(
  messages: ChatMessage[],
  apiKey?: string,
  model?: string
): Promise<ChatResponse> {
  try {
    const key = apiKey || getActiveApiKey('qwen');
    if (!key) {
      return { content: '', error: 'Qwen API key not configured' };
    }

    // Qwen typically uses OpenAI-compatible API
    // Default endpoint, can be overridden via environment variable
    const apiEndpoint = process.env.QWEN_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
    const modelName = model || process.env.QWEN_MODEL || 'qwen-code';

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      return { content: '', error: error.error?.message || 'Qwen API error' };
    }

    const data = await response.json();
    return { content: data.choices[0]?.message?.content || '' };
  } catch (error: any) {
    return { content: '', error: error.message || 'Qwen API error' };
  }
}

// GPT Agent (OpenAI)
export async function chatWithGPT(
  messages: ChatMessage[],
  apiKey?: string,
  model?: string
): Promise<ChatResponse> {
  try {
    const key = apiKey || getActiveApiKey('gpt');
    if (!key) {
      return { content: '', error: 'GPT API key not configured' };
    }

    const client = new OpenAI({
      apiKey: key,
    });

    const modelName = model || process.env.GPT_MODEL || 'gpt-4o';

    // Convert messages to OpenAI format
    const openAIMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : msg.role === 'assistant' ? 'assistant' : 'system',
      content: msg.content,
    }));

    // Handle image if present in the last message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.image_url) {
      // For vision models, we need to use a different format
      const visionMessages = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : msg.role === 'assistant' ? 'assistant' : 'system',
        content: msg.content,
      }));

      visionMessages.push({
        role: 'user',
        content: [
          { type: 'text', text: lastMessage.content },
          {
            type: 'image_url',
            image_url: {
              url: lastMessage.image_url,
            },
          },
        ],
      } as any);

      const response = await client.chat.completions.create({
        model: modelName,
        messages: visionMessages as any,
        max_tokens: 4096,
      });

      return { content: response.choices[0]?.message?.content || '' };
    }

    const response = await client.chat.completions.create({
      model: modelName,
      messages: openAIMessages as any,
      max_tokens: 4096,
    });

    return { content: response.choices[0]?.message?.content || '' };
  } catch (error: any) {
    return { content: '', error: error.message || 'GPT API error' };
  }
}

// Main chat function that routes to the appropriate agent
export async function chatWithAgent(
  agentType: AgentType,
  messages: ChatMessage[],
  apiKey?: string,
  model?: string
): Promise<ChatResponse> {
  switch (agentType) {
    case 'gemini':
      return chatWithGemini(messages, apiKey, model);
    case 'claude':
      return chatWithClaude(messages, apiKey, model);
    case 'qwen':
      return chatWithQwen(messages, apiKey, model);
    case 'gpt':
      return chatWithGPT(messages, apiKey, model);
    default:
      return { content: '', error: `Unknown agent type: ${agentType}` };
  }
}

