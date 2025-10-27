/**
 * Authentication Routes
 * Handles user registration, login, token refresh, and logout
 */

import { Router, Request, Response } from 'express';
import { IAuthService } from '../services/interfaces/IAuthService';
import { container } from '../container/container';
import { TYPES } from '../container/types';
import { SignupCredentials, LoginCredentials } from '@collab/shared';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /auth/signup
 * Register a new user account
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const credentials: SignupCredentials = req.body;

    // Validate request body
    if (!credentials.email || !credentials.username || !credentials.password) {
      res.status(400).json({ error: 'Email, username, and password are required' });
      return;
    }

    const authService = container.get<IAuthService>(TYPES.AuthService);
    const result = await authService.signup(credentials);

    res.status(201).json(result);
  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof Error) {
      // Handle known errors
      if (error.message.includes('already in use') || error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }

      if (error.message.includes('required') || error.message.includes('must be')) {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to create account' });
  }
});

/**
 * POST /auth/login
 * Authenticate user and receive JWT tokens
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const credentials: LoginCredentials = req.body;

    // Validate request body
    if (!credentials.email || !credentials.password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const authService = container.get<IAuthService>(TYPES.AuthService);
    const result = await authService.login(credentials);

    res.status(200).json(result);
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid email or password')) {
        res.status(401).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const authService = container.get<IAuthService>(TYPES.AuthService);
    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json(result);
  } catch (error) {
    console.error('Token refresh error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        res.status(401).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

/**
 * POST /auth/logout
 * Logout user by invalidating refresh token
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const authService = container.get<IAuthService>(TYPES.AuthService);
    await authService.logout(refreshToken);

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

/**
 * GET /auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    res.status(200).json({
      user: {
        id: req.user.userId,
        email: req.user.email,
        username: req.user.username,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
