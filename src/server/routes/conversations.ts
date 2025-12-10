import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, Conversation, Message } from '../models/database';

const router = express.Router();

// Get all conversations
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const conversations = db
      .prepare('SELECT * FROM conversations ORDER BY updated_at DESC')
      .all() as Conversation[];

    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single conversation with messages
router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const conversation = db
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .get(req.params.id) as Conversation | undefined;

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = db
      .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(req.params.id) as Message[];

    res.json({
      ...conversation,
      messages,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new conversation
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, agentType, model } = req.body;

    if (!title || !agentType) {
      return res.status(400).json({ error: 'Title and agentType are required' });
    }

    const db = getDatabase();
    const id = uuidv4();
    const now = Date.now();

    db.prepare(
      'INSERT INTO conversations (id, title, agent_type, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, title, agentType, model || null, now, now);

    const conversation = db
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .get(id) as Conversation;

    res.status(201).json(conversation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update conversation title or model
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const { title, model } = req.body;

    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    if (model !== undefined) {
      updates.push('model = ?');
      values.push(model);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'At least one field (title or model) is required' });
    }

    updates.push('updated_at = ?');
    values.push(Date.now());
    values.push(req.params.id);

    db.prepare(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const conversation = db
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .get(req.params.id) as Conversation;

    res.json(conversation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a conversation
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

