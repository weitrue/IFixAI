import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, Message } from '../models/database';
import { chatWithAgent, AgentType, ChatMessage } from '../services/ai-agents';

const router = express.Router();

// Send a message in a conversation
router.post('/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { message, agentType, apiKey, model } = req.body;

    if (!message || !agentType) {
      return res.status(400).json({ error: 'Message and agentType are required' });
    }

    const db = getDatabase();

    // Get conversation
    const conversation = db
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .get(conversationId) as any;

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Save user message
    const userMessageId = uuidv4();
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(userMessageId, conversationId, 'user', message, Date.now());

    // Get conversation history
    const history = db
      .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(conversationId) as Message[];

    // Convert to chat format
    const chatMessages: ChatMessage[] = history.map(msg => ({
      role: msg.role,
      content: msg.content,
      image_url: msg.image_url || undefined,
    }));

    // Add current message
    chatMessages.push({
      role: 'user',
      content: message,
    });

    // Get AI response
    const response = await chatWithAgent(agentType as AgentType, chatMessages, apiKey, model);

    if (response.error) {
      return res.status(500).json({ error: response.error });
    }

    // Save assistant message
    const assistantMessageId = uuidv4();
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(assistantMessageId, conversationId, 'assistant', response.content, Date.now());

    // Update conversation timestamp
    db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(Date.now(), conversationId);

    res.json({
      message: response.content,
      messageId: assistantMessageId,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stream chat (for real-time responses)
router.post('/:conversationId/stream', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { message, agentType, apiKey, model } = req.body;

    if (!message || !agentType) {
      return res.status(400).json({ error: 'Message and agentType are required' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const db = getDatabase();

    // Save user message
    const userMessageId = uuidv4();
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(userMessageId, conversationId, 'user', message, Date.now());

    // Get conversation history
    const history = db
      .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(conversationId) as Message[];

    const chatMessages: ChatMessage[] = history.map(msg => ({
      role: msg.role,
      content: msg.content,
      image_url: msg.image_url || undefined,
    }));

    chatMessages.push({
      role: 'user',
      content: message,
    });

    // Get conversation to get model
    const conversation = db
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .get(conversationId) as any;

    // For streaming, we'll use a simple approach
    // In production, you'd want to use proper streaming APIs
    const modelToUse = model || conversation?.model;
    const response = await chatWithAgent(agentType as AgentType, chatMessages, apiKey, modelToUse);

    if (response.error) {
      res.write(`data: ${JSON.stringify({ error: response.error })}\n\n`);
      res.end();
      return;
    }

    // Simulate streaming by sending chunks
    const chunks = response.content.split(' ');
    let fullContent = '';

    for (const chunk of chunks) {
      fullContent += (fullContent ? ' ' : '') + chunk;
      res.write(`data: ${JSON.stringify({ content: chunk + ' ' })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Save assistant message
    const assistantMessageId = uuidv4();
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(assistantMessageId, conversationId, 'assistant', fullContent, Date.now());

    db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(Date.now(), conversationId);

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

export default router;

