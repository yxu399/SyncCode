"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("redis");
const cors_1 = __importDefault(require("cors"));
const container_1 = require("./container/container");
const types_1 = require("./container/types");
const environment_1 = require("./config/environment");
const auth_1 = __importDefault(require("./routes/auth"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Configure Socket.IO with proper typing
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"], // React app URLs
        methods: ["GET", "POST"]
    }
});
// Basic middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// HTTP request tracking middleware
app.use((req, res, next) => {
    const start = Date.now();
    // Capture response finish event
    res.on('finish', () => {
        const duration = Date.now() - start;
        const metricsService = container_1.container.get(types_1.TYPES.MetricsService);
        metricsService.trackHttpRequest(req.method, req.route?.path || req.path, res.statusCode, duration);
    });
    next();
});
// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        const metricsService = container_1.container.get(types_1.TYPES.MetricsService);
        const metrics = await metricsService.getMetrics();
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.send(metrics);
    }
    catch (error) {
        console.error('Error generating metrics:', error);
        res.status(500).send('Error generating metrics');
    }
});
// API Routes
app.use('/auth', auth_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Collaborative Editor Server Running',
        environment: environment_1.config.server.nodeEnv,
        redis: 'connected'
    });
});
// Configure Redis Pub/Sub for multi-server coordination
async function setupRedisPubSub() {
    try {
        // Create dedicated Redis clients for pub/sub
        // These are separate from the cache client used by repositories
        const pubClient = (0, redis_1.createClient)({ url: environment_1.config.redis.url });
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
        io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        console.log('✅ Redis Pub/Sub adapter configured');
        console.log('🔗 Multi-server coordination enabled');
        return { pubClient, subClient };
    }
    catch (error) {
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
    const socketController = container_1.container.get(types_1.TYPES.SocketController);
    socketController.setupSocketHandlers(io);
    // Start HTTP server
    server.listen(environment_1.config.server.port, () => {
        console.log(`🚀 Server running on port ${environment_1.config.server.port}`);
        console.log(`📊 Health check: http://localhost:${environment_1.config.server.port}/health`);
        console.log(`📈 Metrics endpoint: http://localhost:${environment_1.config.server.port}/metrics`);
        console.log(`🔌 Socket.IO ready for connections`);
        console.log(`🌐 Environment: ${environment_1.config.server.nodeEnv}`);
    });
}
// Start the server
startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map