import { CursorPosition, UserPresence, HeartbeatData, StatusUpdateData, ActivityStatus } from '../types/presence';
import { ConflictError } from '../types/document';

export interface ServerToClientEvents {
  // Document events
  'document:line-updated': (data: {
    lineNumber: number;
    content: string;
    userId: string;
    version: number;
  }) => void;

  'document:initial-load': (data: {
    content: string[];
    version: number;
  }) => void;

  'document:conflict-detected': (data: {
    conflict: ConflictError;
    currentDocument: {
      content: string[];
      version: number;
    };
  }) => void;

  'document:sync-required': (data: {
    reason: string;
    currentVersion: number;
  }) => void;

  // Presence events
  'presence:cursor-moved': (data: CursorPosition) => void;
  'presence:user-joined': (data: UserPresence) => void;
  'presence:user-left': (data: { userId: string }) => void;
  'presence:room-update': (data: {
    activeUsers: UserPresence[];
  }) => void;
  'presence:status-changed': (data: {
    userId: string;
    status: ActivityStatus;
  }) => void;

  // Room events
  'room:joined': (data: {
    roomId: string;
    users: UserPresence[];
  }) => void;

  'room:error': (data: {
    message: string;
    code: string;
  }) => void;
}

export interface ClientToServerEvents {
  // Room events
  'room:join': (data: {
    roomId: string;
    userId: string;
    username: string;
  }) => void;

  'room:leave': (data: {
    roomId: string;
  }) => void;

  // Document events
  'document:edit-line': (data: {
    roomId: string;
    lineNumber: number;
    content: string;
    clientVersion: number; // Version the client has
  }) => void;

  'document:request-sync': (data: {
    roomId: string;
  }) => void;

  // Presence events
  'presence:update-cursor': (data: {
    roomId: string;
    lineNumber: number;
    column?: number;
  }) => void;

  'presence:heartbeat': (data: HeartbeatData) => void;

  'presence:update-status': (data: StatusUpdateData) => void;
}

export interface InterServerEvents {
  // For future scaling across multiple server instances
}

export interface SocketData {
  userId: string;
  username: string;
  roomId?: string;
}