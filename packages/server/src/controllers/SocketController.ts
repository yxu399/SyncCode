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

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

@injectable()
export class SocketController {
  constructor(
    @inject(TYPES.DocumentService) private documentService: IDocumentService
  ) {}

  public setupSocketHandlers(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void {
    io.on('connection', (socket: TypedSocket) => {
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
          
        } catch (error) {
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
          
        } catch (error) {
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
}