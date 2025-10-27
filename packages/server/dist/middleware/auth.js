"use strict";
/**
 * JWT Authentication Middleware
 * Protects routes by verifying JWT access tokens
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
/**
 * Middleware to authenticate requests using JWT
 * Expects Authorization header with format: "Bearer <token>"
 */
const authenticate = (req, res, next) => {
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
        const payload = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
        // Attach user info to request
        req.user = {
            userId: payload.userId,
            email: payload.email,
            username: payload.username,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.authenticate = authenticate;
/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't fail if no token
 */
const optionalAuthenticate = (req, res, next) => {
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
        const payload = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
        req.user = {
            userId: payload.userId,
            email: payload.email,
            username: payload.username,
        };
        next();
    }
    catch (error) {
        // Don't fail on invalid token, just continue without user
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
//# sourceMappingURL=auth.js.map