"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const container_1 = require("./container/container");
const types_1 = require("./container/types");
const environment_1 = require("./config/environment");
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
// Initialize socket controller with dependency injection
const socketController = container_1.container.get(types_1.TYPES.SocketController);
socketController.setupSocketHandlers(io);
server.listen(environment_1.config.server.port, () => {
    console.log(`🚀 Server running on port ${environment_1.config.server.port}`);
    console.log(`📊 Health check: http://localhost:${environment_1.config.server.port}/health`);
    console.log(`🔌 Socket.IO ready for connections`);
});
//# sourceMappingURL=index.js.map