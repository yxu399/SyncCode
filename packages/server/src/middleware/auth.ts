/**
 * JWT Authentication Middleware
 * Protects routes by verifying JWT access tokens
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AccessTokenPayload } from '@collab/shared';
import { config } from '../config/environment';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        username: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 * Expects Authorization header with format: "Bearer <token>"
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header provided' });
      return;
    }

    // Check if header starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Invalid authorization header format. Expected: Bearer <token>' });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Verify token
    const payload = jwt.verify(token, config.jwt.secret) as AccessTokenPayload;

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't fail if no token
 */
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      next();
      return;
    }

    const payload = jwt.verify(token, config.jwt.secret) as AccessTokenPayload;

    req.user = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
    };

    next();
  } catch (error) {
    // Don't fail on invalid token, just continue without user
    next();
  }
};
