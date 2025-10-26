/**
 * User Repository Interface
 * Defines operations for user data management
 */

import { User, CreateUserInput, UpdateUserInput } from '@collab/shared';

export interface IUserRepository {
  /**
   * Create a new user
   */
  create(data: CreateUserInput): Promise<User>;

  /**
   * Find a user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find a user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find a user by username
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Get user with password hash (for authentication)
   */
  findByIdWithPassword(id: string): Promise<(User & { passwordHash: string }) | null>;

  /**
   * Get user with password hash by email (for login)
   */
  findByEmailWithPassword(email: string): Promise<(User & { passwordHash: string }) | null>;

  /**
   * Update a user
   */
  update(id: string, data: UpdateUserInput): Promise<User>;

  /**
   * Delete a user
   */
  delete(id: string): Promise<void>;

  /**
   * Check if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Check if username exists
   */
  usernameExists(username: string): Promise<boolean>;
}
