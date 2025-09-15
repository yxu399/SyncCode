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
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Configure Socket.IO with proper typing
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:3000", // React app URL
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
        message: 'Collaborative Editor Server Running'
    });
});
// Initialize socket controller with dependency injection
const socketController = container_1.container.get(types_1.TYPES.SocketController);
socketController.setupSocketHandlers(io);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 Socket.IO ready for connections`);
});
//# sourceMappingURL=index.js.map