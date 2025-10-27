/**
 * Authentication Service Implementation
 * Handles user registration, login, token generation and validation
 */

import { injectable, inject } from 'inversify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SignupCredentials, LoginCredentials, AuthResponse, AccessTokenPayload, RefreshTokenPayload } from '@collab/shared';
import { IAuthService } from './interfaces/IAuthService';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { IRefreshTokenRepository } from '../repositories/interfaces/IRefreshTokenRepository';
import { TYPES } from '../container/types';
import { config } from '../config/environment';

const BCRYPT_ROUNDS = 10;

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.RefreshTokenRepository) private refreshTokenRepository: IRefreshTokenRepository
  ) {}

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    // Validate input
    if (!credentials.email || !credentials.username || !credentials.password) {
      throw new Error('Email, username, and password are required');
    }

    if (credentials.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if email or username already exists
    const emailExists = await this.userRepository.emailExists(credentials.email);
    if (emailExists) {
      throw new Error('Email already in use');
    }

    const usernameExists = await this.userRepository.usernameExists(credentials.username);
    if (usernameExists) {
      throw new Error('Username already in use');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(credentials.password, BCRYPT_ROUNDS);

    // Create user
    const user = await this.userRepository.create({
      email: credentials.email,
      username: credentials.username,
      passwordHash,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.username);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      tokens,
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Validate input
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    // Find user with password
    const user = await this.userRepository.findByEmailWithPassword(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!passwordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.username);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      tokens,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as RefreshTokenPayload;

      // Check if token exists in database
      const storedToken = await this.refreshTokenRepository.findByToken(refreshToken);
      if (!storedToken) {
        throw new Error('Invalid refresh token');
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        await this.refreshTokenRepository.deleteByToken(refreshToken);
        throw new Error('Refresh token expired');
      }

      // Get user info
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user.id, user.email, user.username);

      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      // Delete refresh token from database
      await this.refreshTokenRepository.deleteByToken(refreshToken);
    } catch (error) {
      // Silent fail if token doesn't exist
      console.warn('Failed to delete refresh token:', error);
    }
  }

  async verifyAccessToken(token: string): Promise<{ userId: string; email: string; username: string } | null> {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as AccessTokenPayload;
      return {
        userId: payload.userId,
        email: payload.email,
        username: payload.username,
      };
    } catch (error) {
      return null;
    }
  }

  private generateAccessToken(userId: string, email: string, username: string): string {
    const payload: AccessTokenPayload = {
      userId,
      email,
      username,
    };

    const options: jwt.SignOptions = {
      expiresIn: config.jwt.accessExpiry as jwt.SignOptions['expiresIn'],
    };

    return jwt.sign(payload, config.jwt.secret, options);
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const tokenId = Math.random().toString(36).substring(2);

    const payload: RefreshTokenPayload = {
      userId,
      tokenId,
    };

    const options: jwt.SignOptions = {
      expiresIn: config.jwt.refreshExpiry as jwt.SignOptions['expiresIn'],
    };

    const token = jwt.sign(payload, config.jwt.refreshSecret, options);

    // Calculate expiration date (7 days from now by default)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token in database
    await this.refreshTokenRepository.create(userId, token, expiresAt);

    return token;
  }

  private async generateTokens(userId: string, email: string, username: string) {
    const accessToken = this.generateAccessToken(userId, email, username);
    const refreshToken = await this.generateRefreshToken(userId);

    return {
      accessToken,
      refreshToken,
    };
  }
}
