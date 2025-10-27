"use strict";
/**
 * Room Repository Implementation
 * Manages room and membership operations using Prisma
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomRepository = void 0;
const inversify_1 = require("inversify");
const client_1 = require("@prisma/client");
const shared_1 = require("@collab/shared");
const types_1 = require("../container/types");
let RoomRepository = class RoomRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRoom(data) {
        const room = await this.prisma.room.create({
            data: {
                name: data.name,
                ownerId: data.ownerId,
                isPublic: data.isPublic ?? true,
                maxUsers: data.maxUsers ?? 10,
            },
        });
        // Automatically add owner as OWNER member
        await this.prisma.roomMember.create({
            data: {
                userId: data.ownerId,
                roomId: room.id,
                role: client_1.Role.OWNER,
            },
        });
        return room;
    }
    async findRoomById(id) {
        const room = await this.prisma.room.findUnique({
            where: { id },
        });
        return room;
    }
    async findRoomWithMembers(id) {
        const room = await this.prisma.room.findUnique({
            where: { id },
            include: {
                members: true,
            },
        });
        if (!room)
            return null;
        return {
            ...room,
            members: room.members.map(m => ({
                ...m,
                role: m.role,
            })),
        };
    }
    async updateRoom(id, data) {
        const room = await this.prisma.room.update({
            where: { id },
            data,
        });
        return room;
    }
    async deleteRoom(id) {
        // Cascade delete will handle members and other relations
        await this.prisma.room.delete({
            where: { id },
        });
    }
    async findRoomsByOwnerId(ownerId) {
        const rooms = await this.prisma.room.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
        });
        return rooms;
    }
    async addMember(data) {
        const member = await this.prisma.roomMember.create({
            data: {
                userId: data.userId,
                roomId: data.roomId,
                role: data.role ?? client_1.Role.EDITOR,
            },
        });
        return {
            ...member,
            role: member.role,
        };
    }
    async removeMember(userId, roomId) {
        await this.prisma.roomMember.deleteMany({
            where: {
                userId,
                roomId,
            },
        });
    }
    async updateMemberRole(userId, roomId, role) {
        // Find the member first
        const existingMember = await this.prisma.roomMember.findFirst({
            where: { userId, roomId },
        });
        if (!existingMember) {
            throw new Error('Member not found');
        }
        const member = await this.prisma.roomMember.update({
            where: { id: existingMember.id },
            data: { role: role },
        });
        return {
            ...member,
            role: member.role,
        };
    }
    async findMember(userId, roomId) {
        const member = await this.prisma.roomMember.findFirst({
            where: {
                userId,
                roomId,
            },
        });
        if (!member)
            return null;
        return {
            ...member,
            role: member.role,
        };
    }
    async findRoomMembers(roomId) {
        const members = await this.prisma.roomMember.findMany({
            where: { roomId },
            orderBy: { joinedAt: 'asc' },
        });
        return members.map(m => ({
            ...m,
            role: m.role,
        }));
    }
    async findUserRooms(userId) {
        const memberships = await this.prisma.roomMember.findMany({
            where: { userId },
            include: { room: true },
            orderBy: { joinedAt: 'desc' },
        });
        return memberships.map(m => m.room);
    }
    async userHasPermission(userId, roomId, requiredRole) {
        const member = await this.findMember(userId, roomId);
        if (!member)
            return false;
        // Role hierarchy: OWNER > EDITOR > VIEWER
        const roleHierarchy = {
            [shared_1.Role.OWNER]: 3,
            [shared_1.Role.EDITOR]: 2,
            [shared_1.Role.VIEWER]: 1,
        };
        return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
    }
    async isRoomOwner(userId, roomId) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            select: { ownerId: true },
        });
        return room?.ownerId === userId;
    }
};
exports.RoomRepository = RoomRepository;
exports.RoomRepository = RoomRepository = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PrismaClient)),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], RoomRepository);
//# sourceMappingURL=RoomRepository.js.map