/**
 * Room types for collaborative editing spaces
 */
export declare enum Role {
    OWNER = "OWNER",
    EDITOR = "EDITOR",
    VIEWER = "VIEWER"
}
export interface Room {
    id: string;
    name: string;
    ownerId: string;
    isPublic: boolean;
    maxUsers: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface RoomMember {
    id: string;
    userId: string;
    roomId: string;
    role: Role;
    joinedAt: Date;
}
export interface RoomWithMembers extends Room {
    members: RoomMember[];
}
export interface CreateRoomInput {
    name: string;
    ownerId: string;
    isPublic?: boolean;
    maxUsers?: number;
}
export interface UpdateRoomInput {
    name?: string;
    isPublic?: boolean;
    maxUsers?: number;
}
export interface AddMemberInput {
    userId: string;
    roomId: string;
    role?: Role;
}
//# sourceMappingURL=room.d.ts.map