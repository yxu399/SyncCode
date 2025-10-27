export type ActivityStatus = 'active' | 'idle' | 'away';

export interface CursorPosition {
  userId: string;
  lineNumber: number;
  timestamp: number;
  column?: number;
}

export interface UserPresence {
  userId: string;
  username: string;
  isActive: boolean;
  lastSeen: Date;
  currentLine?: number;
  color: string;
  status: ActivityStatus;
  socketId?: string;
}

export interface RoomPresence {
  roomId: string;
  users: UserPresence[];
  activeUsers: number;
}

export interface HeartbeatData {
  roomId: string;
  timestamp: number;
}

export interface StatusUpdateData {
  roomId: string;
  status: ActivityStatus;
}

export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  lineNumber?: number;
  timestamp: number;
}

export interface UserActivity {
  userId: string;
  status: ActivityStatus;
  lastActivity: Date;
}

export interface PresenceHeartbeat {
  roomId: string;
  userId: string;
  timestamp: number;
  socketId: string;
}