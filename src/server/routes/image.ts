import express, { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDatabase } from '../models/database';
import { getActiveApiKey } from '../services/ai-agents';

const router = express.Router();

// Generate image with Gemini 2.5 Flash Image Preview
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, apiKey } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const key = apiKey || getActiveApiKey('gemini');
    if (!key) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Note: Gemini 2.5 Flash Image Preview may have specific image generation capabilities
    // This is a placeholder implementation - adjust based on actual API
    const result = await model.generateContent(prompt);
    const response = result.response;

    // For image generation, the response might contain image data or a reference
    // Adjust based on actual Gemini image generation API
    res.json({
      image: response.text(), // This might be base64 or URL depending on API
      prompt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Edit image
router.post('/edit', async (req: Request, res: Response) => {
  try {
    const { imageData, instruction, apiKey } = req.body;

    if (!imageData || !instruction) {
      return res.status(400).json({ error: 'Image data and instruction are required' });
    }

    const key = apiKey || getActiveApiKey('gemini');
    if (!key) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Process image with instruction
    const prompt = `请根据以下指令编辑这张图片：${instruction}`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: imageData.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: 'image/jpeg',
        },
      },
    ]);

    const response = result.response;
    res.json({
      result: response.text(),
      instruction,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Recognize/analyze image
router.post('/recognize', async (req: Request, res: Response) => {
  try {
    const { imageData, question, apiKey } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const key = apiKey || getActiveApiKey('gemini');
    if (!key) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = question || '请详细描述这张图片的内容。';

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: imageData.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: 'image/jpeg',
        },
      },
    ]);

    const response = result.response;
    res.json({
      description: response.text(),
      question: prompt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

