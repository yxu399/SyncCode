/**
 * Room Repository Implementation
 * Manages room and membership operations using Prisma
 */

import { injectable, inject } from 'inversify';
import { PrismaClient, Role as PrismaRole } from '@prisma/client';
import { Room, RoomMember, RoomWithMembers, CreateRoomInput, UpdateRoomInput, AddMemberInput, Role } from '@collab/shared';
import { IRoomRepository } from './interfaces/IRoomRepository';
import { TYPES } from '../container/types';

@injectable()
export class RoomRepository implements IRoomRepository {
  constructor(
    @inject(TYPES.PrismaClient) private prisma: PrismaClient
  ) {}

  async createRoom(data: CreateRoomInput): Promise<Room> {
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
        role: PrismaRole.OWNER,
      },
    });

    return room;
  }

  async findRoomById(id: string): Promise<Room | null> {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });

    return room;
  }

  async findRoomWithMembers(id: string): Promise<RoomWithMembers | null> {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!room) return null;

    return {
      ...room,
      members: room.members.map(m => ({
        ...m,
        role: m.role as Role,
      })),
    };
  }

  async updateRoom(id: string, data: UpdateRoomInput): Promise<Room> {
    const room = await this.prisma.room.update({
      where: { id },
      data,
    });

    return room;
  }

  async deleteRoom(id: string): Promise<void> {
    // Cascade delete will handle members and other relations
    await this.prisma.room.delete({
      where: { id },
    });
  }

  async findRoomsByOwnerId(ownerId: string): Promise<Room[]> {
    const rooms = await this.prisma.room.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });

    return rooms;
  }

  async addMember(data: AddMemberInput): Promise<RoomMember> {
    const member = await this.prisma.roomMember.create({
      data: {
        userId: data.userId,
        roomId: data.roomId,
        role: (data.role as PrismaRole) ?? PrismaRole.EDITOR,
      },
    });

    return {
      ...member,
      role: member.role as Role,
    };
  }

  async removeMember(userId: string, roomId: string): Promise<void> {
    await this.prisma.roomMember.deleteMany({
      where: {
        userId,
        roomId,
      },
    });
  }

  async updateMemberRole(userId: string, roomId: string, role: Role): Promise<RoomMember> {
    // Find the member first
    const existingMember = await this.prisma.roomMember.findFirst({
      where: { userId, roomId },
    });

    if (!existingMember) {
      throw new Error('Member not found');
    }

    const member = await this.prisma.roomMember.update({
      where: { id: existingMember.id },
      data: { role: role as PrismaRole },
    });

    return {
      ...member,
      role: member.role as Role,
    };
  }

  async findMember(userId: string, roomId: string): Promise<RoomMember | null> {
    const member = await this.prisma.roomMember.findFirst({
      where: {
        userId,
        roomId,
      },
    });

    if (!member) return null;

    return {
      ...member,
      role: member.role as Role,
    };
  }

  async findRoomMembers(roomId: string): Promise<RoomMember[]> {
    const members = await this.prisma.roomMember.findMany({
      where: { roomId },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map(m => ({
      ...m,
      role: m.role as Role,
    }));
  }

  async findUserRooms(userId: string): Promise<Room[]> {
    const memberships = await this.prisma.roomMember.findMany({
      where: { userId },
      include: { room: true },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map(m => m.room);
  }

  async userHasPermission(userId: string, roomId: string, requiredRole: Role): Promise<boolean> {
    const member = await this.findMember(userId, roomId);

    if (!member) return false;

    // Role hierarchy: OWNER > EDITOR > VIEWER
    const roleHierarchy: Record<Role, number> = {
      [Role.OWNER]: 3,
      [Role.EDITOR]: 2,
      [Role.VIEWER]: 1,
    };

    return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
  }

  async isRoomOwner(userId: string, roomId: string): Promise<boolean> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { ownerId: true },
    });

    return room?.ownerId === userId;
  }
}
