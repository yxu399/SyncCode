/**
 * User Repository Implementation
 * Manages user data operations using Prisma
 */

import { injectable, inject } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { User, CreateUserInput, UpdateUserInput } from '@collab/shared';
import { IUserRepository } from './interfaces/IUserRepository';
import { TYPES } from '../container/types';

@injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @inject(TYPES.PrismaClient) private prisma: PrismaClient
  ) {}

  async create(data: CreateUserInput): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findByIdWithPassword(id: string): Promise<(User & { passwordHash: string }) | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user;
  }

  async findByEmailWithPassword(email: string): Promise<(User & { passwordHash: string }) | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user;
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });

    return count > 0;
  }

  async usernameExists(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username },
    });

    return count > 0;
  }
}
