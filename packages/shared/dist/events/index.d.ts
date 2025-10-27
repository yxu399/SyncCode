import { CursorPosition, UserPresence } from '../types/presence';
import { ConflictError } from '../types/document';
export interface ServerToClientEvents {
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
    'presence:cursor-moved': (data: CursorPosition) => void;
    'presence:user-joined': (data: UserPresence) => void;
    'presence:user-left': (data: {
        userId: string;
    }) => void;
    'presence:room-update': (data: {
        activeUsers: UserPresence[];
    }) => void;
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
    'room:join': (data: {
        roomId: string;
        userId: string;
        username: string;
    }) => void;
    'room:leave': (data: {
        roomId: string;
    }) => void;
    'document:edit-line': (data: {
        roomId: string;
        lineNumber: number;
        content: string;
        clientVersion: number;
    }) => void;
    'document:request-sync': (data: {
        roomId: string;
    }) => void;
    'presence:update-cursor': (data: {
        roomId: string;
        lineNumber: number;
    }) => void;
}
export interface InterServerEvents {
}
export interface SocketData {
    userId: string;
    username: string;
    roomId?: string;
}
//# sourceMappingURL=index.d.ts.map