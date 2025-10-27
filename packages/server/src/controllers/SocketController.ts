import { injectable, inject } from 'inversify';
import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData
} from '@collab/shared';
import { TYPES } from '../container/types';
import { IDocumentService } from '../services/interfaces/IDocumentService';
import { IMetricsService } from '../services/interfaces/IMetricsService';
import { DocumentConflictError } from '../services/DocumentService';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

@injectable()
export class SocketController {
  constructor(
    @inject(TYPES.DocumentService) private documentService: IDocumentService,
    @inject(TYPES.MetricsService) private metricsService: IMetricsService
  ) {}

  public setupSocketHandlers(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void {
    io.on('connection', (socket: TypedSocket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Track new connection
      this.metricsService.incrementActiveConnections();
      this.metricsService.trackSocketEvent('connection');

      // Handle room joining
      socket.on('room:join', async (data) => {
        const endTimer = this.metricsService.startSocketEventTimer('room:join');
        this.metricsService.trackSocketEvent('room:join');
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

          // Track document operation
          this.metricsService.trackDocumentOperation('read');

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
          endTimer();

        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('room:error', {
            message: 'Failed to join room',
            code: 'JOIN_ERROR'
          });
          endTimer();
        }
      });

      // Handle line editing with version-based conflict detection
      socket.on('document:edit-line', async (data) => {
        const endTimer = this.metricsService.startSocketEventTimer('document:edit-line');
        this.metricsService.trackSocketEvent('document:edit-line');

        try {
          const { roomId, lineNumber, content, clientVersion } = data;
          const userId = socket.data.userId;

          if (!userId || !socket.data.roomId || socket.data.roomId !== roomId) {
            socket.emit('room:error', {
              message: 'Not authorized for this room',
              code: 'AUTH_ERROR'
            });
            endTimer();
            return;
          }

          // Update the document with version checking
          const updatedDoc = await this.documentService.updateLine(roomId, {
            lineNumber,
            content,
            userId,
            timestamp: Date.now(),
            clientVersion
          });

          // Track document update
          this.metricsService.trackDocumentOperation('update');

          // Broadcast the change to all users in the room (including sender)
          io.to(roomId).emit('document:line-updated', {
            lineNumber,
            content,
            userId,
            version: updatedDoc.version
          });

          endTimer();

        } catch (error) {
          // Handle version conflicts specifically
          if (error instanceof DocumentConflictError) {
            console.warn(`⚠️ Sending conflict notification to user ${socket.data.userId}`);

            // Send conflict notification to the client that tried to edit
            socket.emit('document:conflict-detected', {
              conflict: error.conflict,
              currentDocument: {
                content: error.currentDocument.content,
                version: error.currentDocument.version
              }
            });

            // Also notify them to sync
            socket.emit('document:sync-required', {
              reason: 'Version conflict detected',
              currentVersion: error.currentDocument.version
            });

            endTimer();
            return;
          }

          // Handle other errors
          console.error('Error editing line:', error);
          socket.emit('room:error', {
            message: error instanceof Error ? error.message : 'Failed to update document',
            code: 'EDIT_ERROR'
          });
          endTimer();
        }
      });

      // Handle cursor updates
      socket.on('presence:update-cursor', (data) => {
        this.metricsService.trackSocketEvent('presence:update-cursor');

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
        this.metricsService.trackSocketEvent('disconnect');
        this.metricsService.decrementActiveConnections();

        const { userId, username, roomId } = socket.data;

        if (roomId && userId) {
          socket.to(roomId).emit('presence:user-left', { userId });
          console.log(`User ${username} left room ${roomId}`);
        }

        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }
}