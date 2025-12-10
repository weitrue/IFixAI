import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { getDatabase } from '../models/database';
import { chatWithAgent, AgentType } from '../services/ai-agents';

const router = express.Router();

// Batch rename files
router.post('/rename', async (req: Request, res: Response) => {
  try {
    const { files, pattern, agentType } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Files array is required' });
    }

    // Use AI to generate new names
    const prompt = `请帮我批量重命名以下文件，使用模式：${pattern || '智能命名'}。文件列表：\n${files.map((f: any) => `- ${f.name || f}`).join('\n')}\n\n请返回JSON格式，包含原文件名和新文件名的映射。`;

    const response = await chatWithAgent(agentType || 'gemini', [
      { role: 'user', content: prompt },
    ]);

    if (response.error) {
      return res.status(500).json({ error: response.error });
    }

    // Parse AI response and perform renaming
    // Note: In production, you'd want to validate and sanitize the response
    const renameMap = JSON.parse(response.content);

    const results = [];
    for (const file of files) {
      const newName = renameMap[file.name || file];
      if (newName && file.path) {
        try {
          const oldPath = file.path;
          const dir = path.dirname(oldPath);
          const newPath = path.join(dir, newName);
          await fs.rename(oldPath, newPath);
          results.push({ oldName: file.name, newName, success: true });
        } catch (error: any) {
          results.push({ oldName: file.name, newName, success: false, error: error.message });
        }
      }
    }

    // Log operation
    const db = getDatabase();
    db.prepare(
      'INSERT INTO file_operations (id, operation_type, file_path, result, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), 'batch_rename', JSON.stringify(files), JSON.stringify(results), Date.now());

    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Auto organize files
router.post('/organize', async (req: Request, res: Response) => {
  try {
    const { directory, agentType } = req.body;

    if (!directory) {
      return res.status(400).json({ error: 'Directory is required' });
    }

    // List files in directory
    const files = await fs.readdir(directory, { withFileTypes: true });
    const fileList = files
      .filter(f => f.isFile())
      .map(f => ({ name: f.name, path: path.join(directory, f.name) }));

    // Use AI to categorize files
    const prompt = `请帮我整理以下文件，将它们分类到合适的文件夹中。文件列表：\n${fileList.map(f => `- ${f.name}`).join('\n')}\n\n请返回JSON格式，包含文件名和应该移动到的文件夹名称。`;

    const response = await chatWithAgent(agentType || 'gemini', [
      { role: 'user', content: prompt },
    ]);

    if (response.error) {
      return res.status(500).json({ error: response.error });
    }

    const organization = JSON.parse(response.content);
    const results = [];

    for (const file of fileList) {
      const targetFolder = organization[file.name];
      if (targetFolder) {
        const targetPath = path.join(directory, targetFolder);
        try {
          await fs.mkdir(targetPath, { recursive: true });
          await fs.rename(file.path, path.join(targetPath, file.name));
          results.push({ file: file.name, folder: targetFolder, success: true });
        } catch (error: any) {
          results.push({ file: file.name, folder: targetFolder, success: false, error: error.message });
        }
      }
    }

    const db = getDatabase();
    db.prepare(
      'INSERT INTO file_operations (id, operation_type, file_path, result, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), 'auto_organize', directory, JSON.stringify(results), Date.now());

    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Merge files
router.post('/merge', async (req: Request, res: Response) => {
  try {
    const { files, outputPath, agentType } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0 || !outputPath) {
      return res.status(400).json({ error: 'Files array and outputPath are required' });
    }

    // Read all files
    const contents = [];
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        contents.push({ path: filePath, content });
      } catch (error: any) {
        return res.status(500).json({ error: `Failed to read file ${filePath}: ${error.message}` });
      }
    }

    // Use AI to merge intelligently
    const prompt = `请帮我合并以下文件的内容，保持逻辑清晰和格式统一：\n\n${contents.map(c => `文件：${c.path}\n内容：\n${c.content}\n---\n`).join('\n')}`;

    const response = await chatWithAgent(agentType || 'gemini', [
      { role: 'user', content: prompt },
    ]);

    if (response.error) {
      return res.status(500).json({ error: response.error });
    }

    // Write merged content
    await fs.writeFile(outputPath, response.content, 'utf-8');

    const db = getDatabase();
    db.prepare(
      'INSERT INTO file_operations (id, operation_type, file_path, result, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), 'merge_files', JSON.stringify(files), outputPath, Date.now());

    res.json({ success: true, outputPath });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

