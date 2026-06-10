import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
});
app.use('/api/', limiter);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: 'connected',
  });
});

// Routes
import authRoutes from './routes/auth';
import loanRoutes from './routes/loans';
import stageRoutes from './routes/stages';
import visitRoutes from './routes/visits';
import reminderRoutes from './routes/reminders';
import dashboardRoutes from './routes/dashboard';
import importRoutes from './routes/import';
import activityRoutes from './routes/activity';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/stages', stageRoutes);
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/import', importRoutes);
app.use('/api/v1/activity', activityRoutes);

// WebSocket
io.on('connection', (socket) => {
  console.log(`WS client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`WS client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/v1/health`);
});

export { app, io };
