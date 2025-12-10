import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, ApiKey } from '../models/database';

const router = express.Router();

// Get all API keys
router.get('/api-keys', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const keys = db
      .prepare('SELECT id, agent_type, key_name, is_active, created_at FROM api_keys ORDER BY agent_type, created_at DESC')
      .all() as Omit<ApiKey, 'api_key'>[];

    res.json(keys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get API keys for a specific agent
router.get('/api-keys/:agentType', (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const db = getDatabase();
    const keys = db
      .prepare('SELECT id, agent_type, key_name, is_active, created_at FROM api_keys WHERE agent_type = ? ORDER BY created_at DESC')
      .all(agentType) as Omit<ApiKey, 'api_key'>[];

    res.json(keys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new API key
router.post('/api-keys', (req: Request, res: Response) => {
  try {
    const { agentType, keyName, apiKey } = req.body;

    if (!agentType || !keyName || !apiKey) {
      return res.status(400).json({ error: 'agentType, keyName, and apiKey are required' });
    }

    if (!['gemini', 'claude', 'qwen', 'gpt'].includes(agentType)) {
      return res.status(400).json({ error: 'Invalid agentType. Must be gemini, claude, qwen, or gpt' });
    }

    const db = getDatabase();
    const id = uuidv4();

    try {
      db.prepare(
        'INSERT INTO api_keys (id, agent_type, key_name, api_key, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(id, agentType, keyName, apiKey, 1, Date.now());

      const newKey = db
        .prepare('SELECT id, agent_type, key_name, is_active, created_at FROM api_keys WHERE id = ?')
        .get(id) as Omit<ApiKey, 'api_key'>;

      res.status(201).json(newKey);
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint')) {
        return res.status(409).json({ error: 'API key with this name already exists for this agent' });
      }
      throw error;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update API key (name or active status)
router.patch('/api-keys/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { keyName, isActive, apiKey } = req.body;

    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (keyName !== undefined) {
      updates.push('key_name = ?');
      values.push(keyName);
    }

    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }

    if (apiKey !== undefined) {
      updates.push('api_key = ?');
      values.push(apiKey);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    db.prepare(`UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db
      .prepare('SELECT id, agent_type, key_name, is_active, created_at FROM api_keys WHERE id = ?')
      .get(id) as Omit<ApiKey, 'api_key'>;

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an API key
router.delete('/api-keys/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

