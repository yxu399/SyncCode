export interface Room {
    id: string;
    name: string;
    createdBy: string;
    createdAt: Date;
    isActive: boolean;
    maxUsers?: number;
}
export interface RoomUser {
    userId: string;
    username: string;
    joinedAt: Date;
    role: 'owner' | 'editor' | 'viewer';
}
//# sourceMappingURL=room.d.ts.map