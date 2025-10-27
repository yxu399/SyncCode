/**
 * RefreshToken Repository Implementation
 * Manages refresh token data operations using Prisma
 */

import { injectable, inject } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { RefreshToken } from '@collab/shared';
import { IRefreshTokenRepository } from './interfaces/IRefreshTokenRepository';
import { TYPES } from '../container/types';

@injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @inject(TYPES.PrismaClient) private prisma: PrismaClient
  ) {}

  async create(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return refreshToken;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    return refreshToken;
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return tokens;
  }

  async deleteByToken(token: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { token },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}
