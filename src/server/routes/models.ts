import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, AgentModel } from '../models/database';

const router = express.Router();

// Get all models for an agent
router.get('/:agentType', (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const db = getDatabase();
    const models = db
      .prepare('SELECT * FROM agent_models WHERE agent_type = ? AND is_active = 1 ORDER BY display_order ASC, created_at ASC')
      .all(agentType) as AgentModel[];

    res.json(models);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all models
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const models = db
      .prepare('SELECT * FROM agent_models WHERE is_active = 1 ORDER BY agent_type, display_order ASC, created_at ASC')
      .all() as AgentModel[];

    res.json(models);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new model
router.post('/', (req: Request, res: Response) => {
  try {
    const { agentType, modelValue, modelLabel, isDefault, displayOrder } = req.body;

    if (!agentType || !modelValue || !modelLabel) {
      return res.status(400).json({ error: 'agentType, modelValue, and modelLabel are required' });
    }

    if (!['gemini', 'claude', 'qwen', 'gpt'].includes(agentType)) {
      return res.status(400).json({ error: 'Invalid agentType. Must be gemini, claude, qwen, or gpt' });
    }

    const db = getDatabase();
    const id = uuidv4();

    // If this is set as default, unset other defaults for this agent
    if (isDefault) {
      db.prepare('UPDATE agent_models SET is_default = 0 WHERE agent_type = ?').run(agentType);
    }

    try {
      db.prepare(
        'INSERT INTO agent_models (id, agent_type, model_value, model_label, is_default, is_active, display_order, created_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)'
      ).run(
        id,
        agentType,
        modelValue,
        modelLabel,
        isDefault ? 1 : 0,
        displayOrder || 0,
        Date.now()
      );

      const newModel = db
        .prepare('SELECT * FROM agent_models WHERE id = ?')
        .get(id) as AgentModel;

      res.status(201).json(newModel);
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint')) {
        return res.status(409).json({ error: 'Model with this value already exists for this agent' });
      }
      throw error;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a model
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { modelLabel, isDefault, isActive, displayOrder } = req.body;

    const db = getDatabase();
    const existing = db.prepare('SELECT * FROM agent_models WHERE id = ?').get(id) as AgentModel | undefined;

    if (!existing) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (modelLabel !== undefined) {
      updates.push('model_label = ?');
      values.push(modelLabel);
    }

    if (isDefault !== undefined) {
      // If setting as default, unset other defaults for this agent
      if (isDefault) {
        db.prepare('UPDATE agent_models SET is_default = 0 WHERE agent_type = ? AND id != ?').run(existing.agent_type, id);
      }
      updates.push('is_default = ?');
      values.push(isDefault ? 1 : 0);
    }

    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }

    if (displayOrder !== undefined) {
      updates.push('display_order = ?');
      values.push(displayOrder);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    db.prepare(`UPDATE agent_models SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM agent_models WHERE id = ?').get(id) as AgentModel;

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a model
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM agent_models WHERE id = ?').run(req.params.id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

