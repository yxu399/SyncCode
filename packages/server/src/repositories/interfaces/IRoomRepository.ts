/**
 * Room Repository Interface
 * Defines operations for room and membership management
 */

import { Room, RoomMember, RoomWithMembers, CreateRoomInput, UpdateRoomInput, AddMemberInput, Role } from '@collab/shared';

export interface IRoomRepository {
  /**
   * Create a new room
   */
  createRoom(data: CreateRoomInput): Promise<Room>;

  /**
   * Find a room by ID
   */
  findRoomById(id: string): Promise<Room | null>;

  /**
   * Find a room with its members
   */
  findRoomWithMembers(id: string): Promise<RoomWithMembers | null>;

  /**
   * Update a room
   */
  updateRoom(id: string, data: UpdateRoomInput): Promise<Room>;

  /**
   * Delete a room
   */
  deleteRoom(id: string): Promise<void>;

  /**
   * Get all rooms owned by a user
   */
  findRoomsByOwnerId(ownerId: string): Promise<Room[]>;

  /**
   * Add a member to a room
   */
  addMember(data: AddMemberInput): Promise<RoomMember>;

  /**
   * Remove a member from a room
   */
  removeMember(userId: string, roomId: string): Promise<void>;

  /**
   * Update a member's role
   */
  updateMemberRole(userId: string, roomId: string, role: Role): Promise<RoomMember>;

  /**
   * Get a room member
   */
  findMember(userId: string, roomId: string): Promise<RoomMember | null>;

  /**
   * Get all members of a room
   */
  findRoomMembers(roomId: string): Promise<RoomMember[]>;

  /**
   * Get all rooms a user is a member of
   */
  findUserRooms(userId: string): Promise<Room[]>;

  /**
   * Check if user has permission (is owner or has specific role)
   */
  userHasPermission(userId: string, roomId: string, requiredRole: Role): Promise<boolean>;

  /**
   * Check if user is room owner
   */
  isRoomOwner(userId: string, roomId: string): Promise<boolean>;
}
