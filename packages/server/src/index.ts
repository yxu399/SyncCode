import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
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
import { IMetricsService } from './services/interfaces/IMetricsService';
import { config } from './config/environment';
import authRoutes from './routes/auth';

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

// HTTP request tracking middleware
app.use((req, res, next) => {
  const start = Date.now();

  // Capture response finish event
  res.on('finish', () => {
    const duration = Date.now() - start;
    const metricsService = container.get<IMetricsService>(TYPES.MetricsService);

    metricsService.trackHttpRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      duration
    );
  });

  next();
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metricsService = container.get<IMetricsService>(TYPES.MetricsService);
    const metrics = await metricsService.getMetrics();

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).send('Error generating metrics');
  }
});

// API Routes
app.use('/auth', authRoutes);

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

// Configure Redis Pub/Sub for multi-server coordination
async function setupRedisPubSub() {
  try {
    // Create dedicated Redis clients for pub/sub
    // These are separate from the cache client used by repositories
    const pubClient = createClient({ url: config.redis.url });
    const subClient = pubClient.duplicate();

    // Connect both clients
    await Promise.all([
      pubClient.connect(),
      subClient.connect()
    ]);

    // Set up error handlers
    pubClient.on('error', (err) => console.error('❌ Redis Pub Client Error:', err));
    subClient.on('error', (err) => console.error('❌ Redis Sub Client Error:', err));

    // Create and attach the Redis adapter to Socket.IO
    io.adapter(createAdapter(pubClient, subClient));

    console.log('✅ Redis Pub/Sub adapter configured');
    console.log('🔗 Multi-server coordination enabled');

    return { pubClient, subClient };
  } catch (error) {
    console.error('❌ Failed to setup Redis Pub/Sub:', error);
    console.warn('⚠️  Running in single-server mode without Redis adapter');
    return null;
  }
}

// Initialize application
async function startServer() {
  // Set up Redis Pub/Sub for multi-server coordination
  await setupRedisPubSub();

  // Initialize socket controller with dependency injection
  const socketController = container.get<SocketController>(TYPES.SocketController);
  socketController.setupSocketHandlers(io);

  // Start HTTP server
  server.listen(config.server.port, () => {
    console.log(`🚀 Server running on port ${config.server.port}`);
    console.log(`📊 Health check: http://localhost:${config.server.port}/health`);
    console.log(`📈 Metrics endpoint: http://localhost:${config.server.port}/metrics`);
    console.log(`🔌 Socket.IO ready for connections`);
    console.log(`🌐 Environment: ${config.server.nodeEnv}`);
  });
}

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});