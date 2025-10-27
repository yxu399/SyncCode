/**
 * Enhanced Socket.IO Event Definitions for User Presence System
 */

import {
  CursorPosition,
  TypingIndicator,
  UserActivity,
  UserPresence,
  PresenceHeartbeat,
  PresenceSnapshot
} from '../types/presence-enhanced';

/**
 * Server-to-Client Presence Events
 */
export interface PresenceServerToClientEvents {
  // User presence events
  'presence:user-joined': (data: {
    user: UserPresence;
    roomId: string;
  }) => void;

  'presence:user-left': (data: {
    userId: string;
    roomId: string;
    reason: 'disconnect' | 'timeout' | 'leave';
  }) => void;

  'presence:user-cursor-moved': (data: {
    cursor: CursorPosition;
    roomId: string;
  }) => void;

  'presence:user-typing': (data: {
    typing: TypingIndicator;
    roomId: string;
  }) => void;

  'presence:user-activity-changed': (data: {
    activity: UserActivity;
    roomId: string;
  }) => void;

  'presence:users-list': (data: {
    users: UserPresence[];
    roomId: string;
  }) => void;

  'presence:room-snapshot': (data: PresenceSnapshot) => void;

  'presence:heartbeat-ack': (data: {
    timestamp: number;
    nextHeartbeat: number;
  }) => void;

  'presence:sync-required': (data: {
    reason: string;
    roomId: string;
  }) => void;
}

/**
 * Client-to-Server Presence Events
 */
export interface PresenceClientToServerEvents {
  // Cursor and typing events
  'presence:update-cursor': (data: {
    roomId: string;
    lineNumber: number;
    column?: number;
  }) => void;

  'presence:typing-start': (data: {
    roomId: string;
    lineNumber?: number;
  }) => void;

  'presence:typing-stop': (data: {
    roomId: string;
  }) => void;

  // Activity events
  'presence:activity-update': (data: {
    roomId: string;
    status: 'active' | 'idle' | 'away';
  }) => void;

  // Heartbeat
  'presence:heartbeat': (data: PresenceHeartbeat) => void;

  // Request current presence state
  'presence:request-users': (data: {
    roomId: string;
  }) => void;

  // Manual away/back events
  'presence:set-away': (data: {
    roomId: string;
  }) => void;

  'presence:set-active': (data: {
    roomId: string;
  }) => void;
}