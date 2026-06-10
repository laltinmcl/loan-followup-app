import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app';

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

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
