/**
 * Presence Socket Handler
 * Handles all presence-related Socket.IO events
 */

import { Socket, Server as SocketIOServer } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  UserPresence,
  HeartbeatData,
  StatusUpdateData,
} from '@collab/shared';
import { IPresenceService } from '../services/interfaces/IPresenceService';
import { IMetricsService } from '../services/interfaces/IMetricsService';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Heartbeat configuration
 */
const HEARTBEAT_INTERVAL_MS = 10000; // Client sends heartbeat every 10 seconds

export class PresenceSocketHandler {
  private heartbeatTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private presenceService: IPresenceService,
    private metricsService: IMetricsService
  ) {}

  /**
   * Setup presence event handlers for a socket
   */
  public setupHandlers(socket: TypedSocket, io: TypedIO): void {
    // Handle cursor updates
    socket.on('presence:update-cursor', async (data) => {
      const endTimer = this.metricsService.startSocketEventTimer('presence:update-cursor');
      this.metricsService.trackSocketEvent('presence:update-cursor');

      try {
        const { roomId, lineNumber, column } = data;
        const userId = socket.data.userId;

        if (!userId || !socket.data.roomId || socket.data.roomId !== roomId) {
          endTimer();
          return;
        }

        // Update cursor position in presence service
        await this.presenceService.updateCursorPosition(roomId, userId, lineNumber, column);

        // Broadcast cursor position to other users in the room (not to sender)
        socket.to(roomId).emit('presence:cursor-moved', {
          userId,
          lineNumber,
          column,
          timestamp: Date.now(),
        });

        endTimer();
      } catch (error) {
        console.error('[PresenceSocketHandler] Error handling cursor update:', error);
        endTimer();
      }
    });

    // Handle heartbeat
    socket.on('presence:heartbeat', async (data: HeartbeatData) => {
      try {
        const { roomId } = data;
        const userId = socket.data.userId;

        if (!userId || !socket.data.roomId || socket.data.roomId !== roomId) {
          return;
        }

        // Process heartbeat
        await this.presenceService.processHeartbeat({
          roomId,
          userId,
          timestamp: Date.now(),
          socketId: socket.id,
        });
      } catch (error) {
        console.error('[PresenceSocketHandler] Error processing heartbeat:', error);
      }
    });

    // Handle status updates
    socket.on('presence:update-status', async (data: StatusUpdateData) => {
      const endTimer = this.metricsService.startSocketEventTimer('presence:update-status');
      this.metricsService.trackSocketEvent('presence:update-status');

      try {
        const { roomId, status } = data;
        const userId = socket.data.userId;

        if (!userId || !socket.data.roomId || socket.data.roomId !== roomId) {
          endTimer();
          return;
        }

        // Update user activity status
        await this.presenceService.updateUserActivity(roomId, userId, status);

        // Broadcast status change to all users in the room
        io.to(roomId).emit('presence:status-changed', {
          userId,
          status,
        });

        endTimer();
      } catch (error) {
        console.error('[PresenceSocketHandler] Error handling status update:', error);
        endTimer();
      }
    });
  }

  /**
   * Handle user joining a room (called from SocketController)
   */
  public async handleUserJoin(
    socket: TypedSocket,
    io: TypedIO,
    roomId: string,
    userId: string,
    username: string
  ): Promise<UserPresence> {
    try {
      console.log(`[PresenceSocketHandler] User ${username} joining room ${roomId}`);

      // Add user to presence system
      const presence = await this.presenceService.addUserToRoom(
        roomId,
        userId,
        username,
        socket.id
      );

      // Get all current users in the room
      const roomUsers = await this.presenceService.getRoomUsers(roomId);

      // Notify others in the room about the new user
      socket.to(roomId).emit('presence:user-joined', presence);

      // Send room update to the joining user with all current users
      socket.emit('presence:room-update', {
        activeUsers: roomUsers,
      });

      // Start heartbeat timer for this socket
      this.startHeartbeatTimer(socket, roomId, userId);

      console.log(`[PresenceSocketHandler] User ${username} joined room ${roomId} with color ${presence.color}`);

      return presence;
    } catch (error) {
      console.error('[PresenceSocketHandler] Error handling user join:', error);
      throw error;
    }
  }

  /**
   * Handle user leaving a room or disconnecting
   */
  public async handleUserLeave(
    socket: TypedSocket,
    io: TypedIO,
    roomId: string,
    userId: string,
    reason: 'disconnect' | 'timeout' | 'leave'
  ): Promise<void> {
    try {
      console.log(`[PresenceSocketHandler] User ${userId} leaving room ${roomId} (${reason})`);

      // Stop heartbeat timer
      this.stopHeartbeatTimer(socket.id);

      // Remove user from presence system
      await this.presenceService.removeUserFromRoom(roomId, userId, reason);

      // Notify others in the room
      socket.to(roomId).emit('presence:user-left', { userId });

      console.log(`[PresenceSocketHandler] User ${userId} left room ${roomId}`);
    } catch (error) {
      console.error('[PresenceSocketHandler] Error handling user leave:', error);
    }
  }

  /**
   * Start automatic heartbeat timer for a socket
   * This ensures presence is refreshed even if client doesn't send heartbeats
   */
  private startHeartbeatTimer(socket: TypedSocket, roomId: string, userId: string): void {
    // Clear any existing timer
    this.stopHeartbeatTimer(socket.id);

    const timer = setInterval(async () => {
      try {
        // Refresh presence TTL
        await this.presenceService.processHeartbeat({
          roomId,
          userId,
          timestamp: Date.now(),
          socketId: socket.id,
        });
      } catch (error) {
        console.error('[PresenceSocketHandler] Error in heartbeat timer:', error);
      }
    }, HEARTBEAT_INTERVAL_MS);

    this.heartbeatTimers.set(socket.id, timer);
  }

  /**
   * Stop heartbeat timer for a socket
   */
  private stopHeartbeatTimer(socketId: string): void {
    const timer = this.heartbeatTimers.get(socketId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(socketId);
    }
  }

  /**
   * Cleanup all timers (called on service shutdown)
   */
  public cleanup(): void {
    for (const timer of this.heartbeatTimers.values()) {
      clearInterval(timer);
    }
    this.heartbeatTimers.clear();
  }
}
