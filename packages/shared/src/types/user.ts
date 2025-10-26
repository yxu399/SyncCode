/**
 * User types for authentication and user management
 */

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  passwordHash?: string;
}
