/**
 * Presence Service Implementation
 * Manages real-time user presence with Redis for multi-server coordination
 */

import { injectable, inject } from 'inversify';
import {
  UserPresence,
  CursorPosition,
  TypingIndicator,
  UserActivity,
  PresenceHeartbeat,
  ActivityStatus
} from '@collab/shared';
import { IPresenceService } from './interfaces/IPresenceService';
import { IMetricsService } from './interfaces/IMetricsService';
import { ICacheRepository } from '../repositories/interfaces/ICacheRepository';
import { TYPES } from '../container/types';

// Constants for presence management
const PRESENCE_TTL = 25; // seconds - presence data expires after 25s without heartbeat
const HEARTBEAT_INTERVAL = 10000; // milliseconds - clients should send heartbeat every 10s
const HEARTBEAT_TIMEOUT = 25000; // milliseconds - consider user disconnected after 25s without heartbeat
const CLEANUP_INTERVAL = 10000; // milliseconds - check for timeouts every 10s
const TYPING_INDICATOR_TTL = 3; // seconds - typing indicator expires after 3s

@injectable()
export class PresenceService implements IPresenceService {
  private cleanupTimer?: NodeJS.Timeout;
  private readonly colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71', '#F39C12'
  ];

  constructor(
    @inject(TYPES.CacheRepository) private cacheRepo: ICacheRepository,
    @inject(TYPES.MetricsService) private metricsService: IMetricsService
  ) {}

  /**
   * Add or update user presence in a room
   */
  async addUserToRoom(
    roomId: string,
    userId: string,
    username: string,
    socketId: string,
    serverId?: string
  ): Promise<UserPresence> {
    try {
      console.log(`[PresenceService] Adding user ${username} (${userId}) to room ${roomId}`);

      // Assign color to user (consistent across reconnections)
      const color = await this.assignUserColor(roomId, userId);

      // Create user presence object
      const presence: UserPresence = {
        userId,
        username,
        socketId,
        color,
        isActive: true,
        status: 'active',
        lastSeen: new Date(),
      };

      // Store user presence data in hash
      const userKey = this.getUserPresenceKey(roomId, userId);
      await this.cacheRepo.hset(userKey, 'userId', userId);
      await this.cacheRepo.hset(userKey, 'username', username);
      await this.cacheRepo.hset(userKey, 'socketId', socketId);
      await this.cacheRepo.hset(userKey, 'color', color);
      await this.cacheRepo.hset(userKey, 'isActive', 'true');
      await this.cacheRepo.hset(userKey, 'status', 'active');
      await this.cacheRepo.hset(userKey, 'lastSeen', new Date().toISOString());

      if (serverId) {
        await this.cacheRepo.hset(userKey, 'serverId', serverId);
      }

      // Set TTL for user presence
      await this.cacheRepo.expire(userKey, PRESENCE_TTL);

      // Add user to room's user set
      const roomUsersKey = this.getRoomUsersKey(roomId);
      await this.cacheRepo.sadd(roomUsersKey, userId);

      // Map socket to room:userId for cleanup on disconnect
      const socketKey = this.getSocketMappingKey(socketId);
      await this.cacheRepo.set(socketKey, `${roomId}:${userId}`, PRESENCE_TTL);

      // Update metrics
      this.metricsService.trackSocketEvent('presence:user-joined');
      await this.updateRoomMetrics(roomId);

      console.log(`[PresenceService] User ${username} added to room ${roomId} with color ${color}`);

      return presence;
    } catch (error) {
      console.error('[PresenceService] Error adding user to room:', error);
      throw error;
    }
  }

  /**
   * Remove user from room
   */
  async removeUserFromRoom(
    roomId: string,
    userId: string,
    reason: 'disconnect' | 'timeout' | 'leave'
  ): Promise<void> {
    try {
      console.log(`[PresenceService] Removing user ${userId} from room ${roomId} (reason: ${reason})`);

      // Get user data before removal
      const userKey = this.getUserPresenceKey(roomId, userId);
      const socketId = await this.cacheRepo.hget(userKey, 'socketId');

      // Remove user from room's user set
      const roomUsersKey = this.getRoomUsersKey(roomId);
      await this.cacheRepo.srem(roomUsersKey, userId);

      // Delete user presence data
      await this.cacheRepo.delete(userKey);

      // Remove socket mapping if exists
      if (socketId) {
        const socketKey = this.getSocketMappingKey(socketId);
        await this.cacheRepo.delete(socketKey);
      }

      // Clean up related keys
      await this.cacheRepo.delete(this.getHeartbeatKey(roomId, userId));
      await this.cacheRepo.delete(this.getCursorKey(roomId, userId));
      await this.cacheRepo.delete(this.getTypingKey(roomId, userId));

      // Update metrics
      this.metricsService.trackSocketEvent(`presence:user-left:${reason}`);
      await this.updateRoomMetrics(roomId);

      console.log(`[PresenceService] User ${userId} removed from room ${roomId}`);
    } catch (error) {
      console.error('[PresenceService] Error removing user from room:', error);
      throw error;
    }
  }

  /**
   * Get all users in a room
   */
  async getRoomUsers(roomId: string): Promise<UserPresence[]> {
    try {
      const roomUsersKey = this.getRoomUsersKey(roomId);
      const userIds = await this.cacheRepo.smembers(roomUsersKey);

      const users: UserPresence[] = [];

      for (const userId of userIds) {
        const presence = await this.getUserPresence(roomId, userId);
        if (presence) {
          users.push(presence);
        }
      }

      console.log(`[PresenceService] Retrieved ${users.length} users from room ${roomId}`);
      return users;
    } catch (error) {
      console.error('[PresenceService] Error getting room users:', error);
      return [];
    }
  }

  /**
   * Get specific user presence
   */
  async getUserPresence(roomId: string, userId: string): Promise<UserPresence | null> {
    try {
      const userKey = this.getUserPresenceKey(roomId, userId);
      const userData = await this.cacheRepo.hgetall(userKey);

      if (!userData || Object.keys(userData).length === 0) {
        return null;
      }

      const presence: UserPresence = {
        userId: userData.userId,
        username: userData.username,
        socketId: userData.socketId,
        color: userData.color,
        isActive: userData.isActive === 'true',
        status: userData.status as ActivityStatus,
        lastSeen: new Date(userData.lastSeen),
        currentLine: userData.currentLine ? parseInt(userData.currentLine, 10) : undefined,
      };

      return presence;
    } catch (error) {
      console.error('[PresenceService] Error getting user presence:', error);
      return null;
    }
  }

  /**
   * Update cursor position
   */
  async updateCursorPosition(
    roomId: string,
    userId: string,
    lineNumber: number,
    column?: number
  ): Promise<CursorPosition> {
    try {
      const userKey = this.getUserPresenceKey(roomId, userId);

      // Update cursor position in user presence
      await this.cacheRepo.hset(userKey, 'currentLine', lineNumber.toString());
      await this.cacheRepo.hset(userKey, 'lastSeen', new Date().toISOString());

      // Refresh TTL
      await this.cacheRepo.expire(userKey, PRESENCE_TTL);

      this.metricsService.trackSocketEvent('presence:cursor-update');

      const cursor: CursorPosition = {
        userId,
        lineNumber,
        column,
        timestamp: Date.now(),
      };

      return cursor;
    } catch (error) {
      console.error('[PresenceService] Error updating cursor position:', error);
      throw error;
    }
  }

  /**
   * Update typing indicator
   */
  async updateTypingIndicator(
    roomId: string,
    userId: string,
    isTyping: boolean,
    lineNumber?: number
  ): Promise<TypingIndicator> {
    try {
      const userKey = this.getUserPresenceKey(roomId, userId);

      await this.cacheRepo.hset(userKey, 'isTyping', isTyping.toString());
      if (lineNumber !== undefined) {
        await this.cacheRepo.hset(userKey, 'typingLine', lineNumber.toString());
      }
      await this.cacheRepo.hset(userKey, 'lastSeen', new Date().toISOString());

      // Refresh TTL
      await this.cacheRepo.expire(userKey, PRESENCE_TTL);

      this.metricsService.trackSocketEvent(`presence:typing-${isTyping ? 'start' : 'stop'}`);

      return {
        userId,
        isTyping,
        lineNumber,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[PresenceService] Error updating typing indicator:', error);
      throw error;
    }
  }

  /**
   * Update user activity status
   */
  async updateUserActivity(
    roomId: string,
    userId: string,
    status: ActivityStatus
  ): Promise<UserActivity> {
    try {
      const userKey = this.getUserPresenceKey(roomId, userId);

      await this.cacheRepo.hset(userKey, 'status', status);
      await this.cacheRepo.hset(userKey, 'lastSeen', new Date().toISOString());

      // Refresh TTL
      await this.cacheRepo.expire(userKey, PRESENCE_TTL);

      this.metricsService.trackSocketEvent(`presence:activity-${status}`);

      return {
        userId,
        status,
        lastActivity: new Date(),
      };
    } catch (error) {
      console.error('[PresenceService] Error updating user activity:', error);
      throw error;
    }
  }

  /**
   * Process heartbeat from user
   */
  async processHeartbeat(heartbeat: PresenceHeartbeat): Promise<void> {
    try {
      const { roomId, userId, socketId } = heartbeat;
      const userKey = this.getUserPresenceKey(roomId, userId);

      // Check if user exists
      const exists = await this.cacheRepo.exists(userKey);
      if (!exists) {
        console.warn(`[PresenceService] Heartbeat for non-existent user ${userId} in room ${roomId}`);
        this.metricsService.trackPresenceHeartbeat(false);
        return;
      }

      // Update last seen
      await this.cacheRepo.hset(userKey, 'lastSeen', new Date().toISOString());
      await this.cacheRepo.hset(userKey, 'isActive', 'true');

      // Refresh TTL
      await this.cacheRepo.expire(userKey, PRESENCE_TTL);

      // Also refresh socket mapping TTL
      const socketKey = this.getSocketMappingKey(socketId);
      await this.cacheRepo.expire(socketKey, PRESENCE_TTL);

      // Track successful heartbeat
      this.metricsService.trackPresenceHeartbeat(true);

      console.log(`[PresenceService] Heartbeat processed for user ${userId} in room ${roomId}`);
    } catch (error) {
      console.error('[PresenceService] Error processing heartbeat:', error);
      this.metricsService.trackPresenceHeartbeat(false);
    }
  }

  /**
   * Check for timed out users
   */
  async checkTimeouts(roomId: string): Promise<string[]> {
    try {
      const roomUsersKey = this.getRoomUsersKey(roomId);
      const userIds = await this.cacheRepo.smembers(roomUsersKey);

      const timedOutUsers: string[] = [];

      for (const userId of userIds) {
        const userKey = this.getUserPresenceKey(roomId, userId);
        const ttl = await this.cacheRepo.ttl(userKey);

        // TTL returns -2 if key doesn't exist, -1 if no expiry
        if (ttl === -2 || ttl <= 0) {
          console.warn(`[PresenceService] User ${userId} timed out in room ${roomId}`);
          timedOutUsers.push(userId);
          await this.removeUserFromRoom(roomId, userId, 'timeout');
        }
      }

      if (timedOutUsers.length > 0) {
        console.log(`[PresenceService] Cleaned up ${timedOutUsers.length} timed out users from room ${roomId}`);
      }

      return timedOutUsers;
    } catch (error) {
      console.error('[PresenceService] Error checking timeouts:', error);
      return [];
    }
  }

  /**
   * Clean up all presence data for a room
   */
  async cleanupRoom(roomId: string): Promise<void> {
    try {
      console.log(`[PresenceService] Cleaning up room ${roomId}`);

      const roomUsersKey = this.getRoomUsersKey(roomId);
      const userIds = await this.cacheRepo.smembers(roomUsersKey);

      // Remove all users
      for (const userId of userIds) {
        await this.removeUserFromRoom(roomId, userId, 'leave');
      }

      // Remove room users set
      await this.cacheRepo.delete(roomUsersKey);

      // Remove color assignments
      const colorsKey = this.getRoomColorsKey(roomId);
      await this.cacheRepo.delete(colorsKey);

      await this.updateRoomMetrics(roomId);

      console.log(`[PresenceService] Room ${roomId} cleaned up`);
    } catch (error) {
      console.error('[PresenceService] Error cleaning up room:', error);
    }
  }

  /**
   * Get room presence statistics
   */
  async getRoomPresenceStats(roomId: string): Promise<{
    activeUsers: number;
    idleUsers: number;
    awayUsers: number;
    totalUsers: number;
  }> {
    try {
      const users = await this.getRoomUsers(roomId);

      const stats = {
        activeUsers: 0,
        idleUsers: 0,
        awayUsers: 0,
        totalUsers: users.length,
      };

      for (const user of users) {
        switch (user.status) {
          case 'active':
            stats.activeUsers++;
            break;
          case 'idle':
            stats.idleUsers++;
            break;
          case 'away':
            stats.awayUsers++;
            break;
        }
      }

      return stats;
    } catch (error) {
      console.error('[PresenceService] Error getting room presence stats:', error);
      return { activeUsers: 0, idleUsers: 0, awayUsers: 0, totalUsers: 0 };
    }
  }

  /**
   * Restore user presence (for reconnection)
   */
  async restoreUserPresence(
    roomId: string,
    userId: string,
    socketId: string
  ): Promise<UserPresence | null> {
    try {
      const presence = await this.getUserPresence(roomId, userId);

      if (presence) {
        // Update socket ID and refresh TTL
        const userKey = this.getUserPresenceKey(roomId, userId);
        await this.cacheRepo.hset(userKey, 'socketId', socketId);
        await this.cacheRepo.hset(userKey, 'isActive', 'true');
        await this.cacheRepo.hset(userKey, 'lastSeen', new Date().toISOString());
        await this.cacheRepo.expire(userKey, PRESENCE_TTL);

        // Update socket mapping
        const socketKey = this.getSocketMappingKey(socketId);
        await this.cacheRepo.set(socketKey, `${roomId}:${userId}`, PRESENCE_TTL);

        console.log(`[PresenceService] Restored presence for user ${userId} in room ${roomId}`);
        return { ...presence, socketId };
      }

      return null;
    } catch (error) {
      console.error('[PresenceService] Error restoring user presence:', error);
      return null;
    }
  }

  /**
   * Get all active rooms
   */
  async getActiveRooms(): Promise<string[]> {
    try {
      // This is a simplified implementation
      // In production, you might want to maintain a separate set of active rooms
      console.warn('[PresenceService] getActiveRooms is not fully implemented');
      return [];
    } catch (error) {
      console.error('[PresenceService] Error getting active rooms:', error);
      return [];
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval(): void {
    if (this.cleanupTimer) {
      console.warn('[PresenceService] Cleanup interval already running');
      return;
    }

    console.log(`[PresenceService] Starting cleanup interval (${CLEANUP_INTERVAL}ms)`);

    this.cleanupTimer = setInterval(async () => {
      // This would need to iterate over all active rooms
      // For now, we'll log that cleanup is running
      console.log('[PresenceService] Cleanup interval tick (not fully implemented)');
    }, CLEANUP_INTERVAL);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
      console.log('[PresenceService] Cleanup interval stopped');
    }
  }

  // Private helper methods

  private getRoomUsersKey(roomId: string): string {
    return `presence:room:${roomId}:users`;
  }

  private getUserPresenceKey(roomId: string, userId: string): string {
    return `presence:room:${roomId}:user:${userId}`;
  }

  private getSocketMappingKey(socketId: string): string {
    return `presence:socket:${socketId}`;
  }

  private getRoomColorsKey(roomId: string): string {
    return `presence:room:${roomId}:colors`;
  }

  private getHeartbeatKey(roomId: string, userId: string): string {
    return `presence:heartbeat:${roomId}:${userId}`;
  }

  private getCursorKey(roomId: string, userId: string): string {
    return `presence:cursor:${roomId}:${userId}`;
  }

  private getTypingKey(roomId: string, userId: string): string {
    return `presence:typing:${roomId}:${userId}`;
  }

  /**
   * Assign a color to a user in a room
   * Uses consistent hashing to maintain color across reconnections
   */
  private async assignUserColor(roomId: string, userId: string): Promise<string> {
    const colorsKey = this.getRoomColorsKey(roomId);
    const existingColor = await this.cacheRepo.hget(colorsKey, userId);

    if (existingColor) {
      return existingColor;
    }

    // Get all assigned colors in this room
    const assignedColors = await this.cacheRepo.hgetall(colorsKey);
    const usedColors = new Set(Object.values(assignedColors));

    // Find first available color or use hash-based selection
    let color = this.colors.find(c => !usedColors.has(c));

    if (!color) {
      // All colors used, use hash-based selection
      const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      color = this.colors[hash % this.colors.length];
    }

    // Store color assignment
    await this.cacheRepo.hset(colorsKey, userId, color);

    return color;
  }

  private async updateRoomMetrics(roomId: string): Promise<void> {
    try {
      const stats = await this.getRoomPresenceStats(roomId);
      const activeRooms = await this.getActiveRooms();

      // Update room-specific metrics
      this.metricsService.setRoomActiveUsers(roomId, stats.totalUsers);

      // Update global metrics
      this.metricsService.setActiveRooms(activeRooms.length);

      // Calculate total active users across all rooms
      let totalActiveUsers = 0;
      for (const room of activeRooms) {
        const roomStats = await this.getRoomPresenceStats(room);
        totalActiveUsers += roomStats.totalUsers;
      }
      this.metricsService.setActiveUsers(totalActiveUsers);
    } catch (error) {
      console.error('[PresenceService] Error updating room metrics:', error);
    }
  }
}