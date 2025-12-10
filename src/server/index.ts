import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './models/database';
import chatRoutes from './routes/chat';
import conversationRoutes from './routes/conversations';
import settingsRoutes from './routes/settings';
import fileRoutes from './routes/files';
import excelRoutes from './routes/excel';
import imageRoutes from './routes/image';
import modelsRoutes from './routes/models';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize database
initDatabase();

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/models', modelsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

