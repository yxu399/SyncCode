export interface CursorPosition {
    userId: string;
    lineNumber: number;
    timestamp: number;
}
export interface UserPresence {
    userId: string;
    username: string;
    isActive: boolean;
    lastSeen: Date;
    currentLine?: number;
}
export interface RoomPresence {
    roomId: string;
    users: UserPresence[];
    activeUsers: number;
}
//# sourceMappingURL=presence.d.ts.map