import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/ifixai.db');
const DB_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeTables();
  }
  return db;
}

function initializeTables() {
  if (!db) return;

  // Conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      agent_type TEXT NOT NULL,
      model TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Add model column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE conversations ADD COLUMN model TEXT`);
  } catch (error: any) {
    // Column already exists, ignore error
    if (!error.message.includes('duplicate column')) {
      console.warn('Database migration warning:', error.message);
    }
  }

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )
  `);

  // API Keys table
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      agent_type TEXT NOT NULL,
      key_name TEXT NOT NULL,
      api_key TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      UNIQUE(agent_type, key_name)
    )
  `);

  // File operations log
  db.exec(`
    CREATE TABLE IF NOT EXISTS file_operations (
      id TEXT PRIMARY KEY,
      operation_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      result TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  // Agent models table
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_models (
      id TEXT PRIMARY KEY,
      agent_type TEXT NOT NULL,
      model_value TEXT NOT NULL,
      model_label TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      UNIQUE(agent_type, model_value)
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
    CREATE INDEX IF NOT EXISTS idx_api_keys_agent_type ON api_keys(agent_type);
    CREATE INDEX IF NOT EXISTS idx_agent_models_agent_type ON agent_models(agent_type);
  `);

  // Initialize default models if table is empty
  const modelCount = db.prepare('SELECT COUNT(*) as count FROM agent_models').get() as { count: number };
  if (modelCount.count === 0) {
    initializeDefaultModels();
  }
}

function initializeDefaultModels() {
  if (!db) return;

  const defaultModels = [
    // Gemini models
    { agent_type: 'gemini', value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)', is_default: 1, order: 0 },
    { agent_type: 'gemini', value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', is_default: 0, order: 1 },
    { agent_type: 'gemini', value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', is_default: 0, order: 2 },
    { agent_type: 'gemini', value: 'gemini-pro', label: 'Gemini Pro', is_default: 0, order: 3 },
    // Claude models
    { agent_type: 'claude', value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', is_default: 1, order: 0 },
    { agent_type: 'claude', value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', is_default: 0, order: 1 },
    { agent_type: 'claude', value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', is_default: 0, order: 2 },
    { agent_type: 'claude', value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', is_default: 0, order: 3 },
    // GPT models
    { agent_type: 'gpt', value: 'gpt-4o', label: 'GPT-4o', is_default: 1, order: 0 },
    { agent_type: 'gpt', value: 'gpt-4-turbo', label: 'GPT-4 Turbo', is_default: 0, order: 1 },
    { agent_type: 'gpt', value: 'gpt-4', label: 'GPT-4', is_default: 0, order: 2 },
    { agent_type: 'gpt', value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', is_default: 0, order: 3 },
    // Qwen models
    { agent_type: 'qwen', value: 'qwen-code', label: 'Qwen Code', is_default: 1, order: 0 },
    { agent_type: 'qwen', value: 'qwen-plus', label: 'Qwen Plus', is_default: 0, order: 1 },
    { agent_type: 'qwen', value: 'qwen-turbo', label: 'Qwen Turbo', is_default: 0, order: 2 },
  ];

  const insert = db.prepare(`
    INSERT INTO agent_models (id, agent_type, model_value, model_label, is_default, is_active, display_order, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `);

  const insertMany = db.transaction((models: typeof defaultModels) => {
    for (const model of models) {
      insert.run(
        uuidv4(),
        model.agent_type,
        model.value,
        model.label,
        model.is_default,
        model.order,
        Date.now()
      );
    }
  });

  insertMany(defaultModels);
}

export function initDatabase() {
  getDatabase();
  console.log('✅ Database initialized');
}

export interface Conversation {
  id: string;
  title: string;
  agent_type: string;
  model?: string;
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
  agent_type: 'gemini' | 'claude' | 'qwen' | 'gpt';
  key_name: string;
  api_key: string;
  is_active: number;
  created_at: number;
}

export interface AgentModel {
  id: string;
  agent_type: 'gemini' | 'claude' | 'qwen' | 'gpt';
  model_value: string;
  model_label: string;
  is_default: number;
  is_active: number;
  display_order: number;
  created_at: number;
}

