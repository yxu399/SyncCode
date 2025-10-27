/**
 * Presence Service Interface
 * Manages real-time user presence, cursors, typing indicators, and activity status
 */

import {
  UserPresence,
  CursorPosition,
  TypingIndicator,
  UserActivity,
  PresenceHeartbeat,
  RoomPresence
} from '@collab/shared';

export interface IPresenceService {
  /**
   * Add or update user presence in a room
   */
  addUserToRoom(
    roomId: string,
    userId: string,
    username: string,
    socketId: string,
    serverId?: string
  ): Promise<UserPresence>;

  /**
   * Remove user from room
   */
  removeUserFromRoom(
    roomId: string,
    userId: string,
    reason: 'disconnect' | 'timeout' | 'leave'
  ): Promise<void>;

  /**
   * Get all users in a room
   */
  getRoomUsers(roomId: string): Promise<UserPresence[]>;

  /**
   * Get specific user presence
   */
  getUserPresence(roomId: string, userId: string): Promise<UserPresence | null>;

  /**
   * Update cursor position for a user
   */
  updateCursorPosition(
    roomId: string,
    userId: string,
    lineNumber: number,
    column?: number
  ): Promise<CursorPosition>;

  /**
   * Update typing indicator for a user
   */
  updateTypingIndicator(
    roomId: string,
    userId: string,
    isTyping: boolean,
    lineNumber?: number
  ): Promise<TypingIndicator>;

  /**
   * Update user activity status
   */
  updateUserActivity(
    roomId: string,
    userId: string,
    status: 'active' | 'idle' | 'away'
  ): Promise<UserActivity>;

  /**
   * Process heartbeat from user
   */
  processHeartbeat(heartbeat: PresenceHeartbeat): Promise<void>;

  /**
   * Check for timed out users (should be called periodically)
   */
  checkTimeouts(roomId: string): Promise<string[]>; // Returns list of timed out userIds

  /**
   * Clean up all presence data for a room
   */
  cleanupRoom(roomId: string): Promise<void>;

  /**
   * Get room presence statistics
   */
  getRoomPresenceStats(roomId: string): Promise<{
    activeUsers: number;
    idleUsers: number;
    awayUsers: number;
    totalUsers: number;
  }>;

  /**
   * Restore presence from cache (for reconnection scenarios)
   */
  restoreUserPresence(
    roomId: string,
    userId: string,
    socketId: string
  ): Promise<UserPresence | null>;

  /**
   * Get all active rooms with presence data
   */
  getActiveRooms(): Promise<string[]>;

  /**
   * Set cleanup interval for checking timeouts
   */
  startCleanupInterval(): void;

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void;
}