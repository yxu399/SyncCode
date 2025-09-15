"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../container/types");
let SocketController = class SocketController {
    documentService;
    constructor(documentService) {
        this.documentService = documentService;
    }
    setupSocketHandlers(io) {
        io.on('connection', (socket) => {
            console.log(`Socket connected: ${socket.id}`);
            // Handle room joining
            socket.on('room:join', async (data) => {
                try {
                    const { roomId, userId, username } = data;
                    // Join the socket room
                    await socket.join(roomId);
                    // Store user data in socket
                    socket.data.userId = userId;
                    socket.data.username = username;
                    socket.data.roomId = roomId;
                    // Get or create document for this room
                    const document = await this.documentService.getOrCreateDocument(roomId);
                    // Send initial document to user
                    socket.emit('document:initial-load', {
                        content: document.content,
                        version: document.version
                    });
                    // Notify room of new user
                    socket.to(roomId).emit('presence:user-joined', {
                        userId,
                        username,
                        isActive: true,
                        lastSeen: new Date()
                    });
                    console.log(`User ${username} joined room ${roomId}`);
                }
                catch (error) {
                    console.error('Error joining room:', error);
                    socket.emit('room:error', {
                        message: 'Failed to join room',
                        code: 'JOIN_ERROR'
                    });
                }
            });
            // Handle line editing
            socket.on('document:edit-line', async (data) => {
                try {
                    const { roomId, lineNumber, content } = data;
                    const userId = socket.data.userId;
                    if (!userId || !socket.data.roomId || socket.data.roomId !== roomId) {
                        socket.emit('room:error', {
                            message: 'Not authorized for this room',
                            code: 'AUTH_ERROR'
                        });
                        return;
                    }
                    // Update the document
                    const updatedDoc = await this.documentService.updateLine(roomId, {
                        lineNumber,
                        content,
                        userId,
                        timestamp: Date.now()
                    });
                    // Broadcast the change to all users in the room (including sender)
                    io.to(roomId).emit('document:line-updated', {
                        lineNumber,
                        content,
                        userId,
                        version: updatedDoc.version
                    });
                }
                catch (error) {
                    console.error('Error editing line:', error);
                    socket.emit('room:error', {
                        message: 'Failed to update document',
                        code: 'EDIT_ERROR'
                    });
                }
            });
            // Handle cursor updates
            socket.on('presence:update-cursor', (data) => {
                const { roomId, lineNumber } = data;
                const userId = socket.data.userId;
                if (userId && socket.data.roomId === roomId) {
                    socket.to(roomId).emit('presence:cursor-moved', {
                        userId,
                        lineNumber,
                        timestamp: Date.now()
                    });
                }
            });
            // Handle disconnection
            socket.on('disconnect', () => {
                const { userId, username, roomId } = socket.data;
                if (roomId && userId) {
                    socket.to(roomId).emit('presence:user-left', { userId });
                    console.log(`User ${username} left room ${roomId}`);
                }
                console.log(`Socket disconnected: ${socket.id}`);
            });
        });
    }
};
exports.SocketController = SocketController;
exports.SocketController = SocketController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.DocumentService)),
    __metadata("design:paramtypes", [Object])
], SocketController);
//# sourceMappingURL=SocketController.js.map