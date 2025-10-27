/**
 * Enhanced Presence Types for Real-time User Tracking
 */

export interface CursorPosition {
  userId: string;
  lineNumber: number;
  column?: number;
  timestamp: number;
}

export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  lineNumber?: number;
  timestamp: number;
}

export interface UserActivity {
  userId: string;
  status: 'active' | 'idle' | 'away';
  lastActivity: number;
  timestamp: number;
}

export interface UserPresence {
  userId: string;
  username: string;
  socketId: string;
  color?: string; // For cursor color
  isActive: boolean;
  status: 'online' | 'idle' | 'away' | 'offline';
  lastSeen: Date;
  lastActivity: Date;
  currentLine?: number;
  currentColumn?: number;
  isTyping?: boolean;
  serverId?: string; // Track which server instance the user is connected to
}

export interface RoomPresence {
  roomId: string;
  users: Map<string, UserPresence>;
  activeUsers: number;
  totalUsers: number;
  lastUpdated: Date;
}

export interface PresenceHeartbeat {
  userId: string;
  roomId: string;
  timestamp: number;
  socketId: string;
}

export interface PresenceSnapshot {
  roomId: string;
  users: UserPresence[];
  timestamp: number;
}