/**
 * RefreshToken Repository Interface
 */

import { RefreshToken } from '@collab/shared';

export interface IRefreshTokenRepository {
  /**
   * Create a new refresh token
   */
  create(userId: string, token: string, expiresAt: Date): Promise<RefreshToken>;

  /**
   * Find a refresh token by token string
   */
  findByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Find all refresh tokens for a user
   */
  findByUserId(userId: string): Promise<RefreshToken[]>;

  /**
   * Delete a refresh token by token string
   */
  deleteByToken(token: string): Promise<void>;

  /**
   * Delete all refresh tokens for a user
   */
  deleteByUserId(userId: string): Promise<void>;

  /**
   * Delete all expired refresh tokens
   */
  deleteExpired(): Promise<number>;
}
