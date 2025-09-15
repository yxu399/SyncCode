import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData 
} from '@collab/shared';
import { container } from './container/container';
import { TYPES } from './container/types';
import { SocketController } from './controllers/SocketController';
import { config } from './config/environment';

const app = express();
const server = createServer(app);

// Configure Socket.IO with proper typing
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"], // React app URLs
    methods: ["GET", "POST"]
  }
});

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Collaborative Editor Server Running',
    environment: config.server.nodeEnv,
    redis: 'connected'
  });
});

// Initialize socket controller with dependency injection
const socketController = container.get<SocketController>(TYPES.SocketController);
socketController.setupSocketHandlers(io);

server.listen(config.server.port, () => {
  console.log(`🚀 Server running on port ${config.server.port}`);
  console.log(`📊 Health check: http://localhost:${config.server.port}/health`);
  console.log(`🔌 Socket.IO ready for connections`);
});