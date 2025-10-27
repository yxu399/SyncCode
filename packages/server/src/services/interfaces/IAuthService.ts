/**
 * Authentication Service Interface
 */

import { SignupCredentials, LoginCredentials, AuthResponse } from '@collab/shared';

export interface IAuthService {
  /**
   * Register a new user
   * @throws Error if email or username already exists
   */
  signup(credentials: SignupCredentials): Promise<AuthResponse>;

  /**
   * Authenticate a user and generate tokens
   * @throws Error if credentials are invalid
   */
  login(credentials: LoginCredentials): Promise<AuthResponse>;

  /**
   * Refresh access token using refresh token
   * @throws Error if refresh token is invalid or expired
   */
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }>;

  /**
   * Logout user by invalidating refresh token
   */
  logout(refreshToken: string): Promise<void>;

  /**
   * Verify and decode access token
   * @returns User payload if valid, null if invalid
   */
  verifyAccessToken(token: string): Promise<{ userId: string; email: string; username: string } | null>;
}
