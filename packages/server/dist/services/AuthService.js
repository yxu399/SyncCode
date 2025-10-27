"use strict";
/**
 * Authentication Service Implementation
 * Handles user registration, login, token generation and validation
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const inversify_1 = require("inversify");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../container/types");
const environment_1 = require("../config/environment");
const BCRYPT_ROUNDS = 10;
let AuthService = class AuthService {
    userRepository;
    refreshTokenRepository;
    constructor(userRepository, refreshTokenRepository) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }
    async signup(credentials) {
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
        const passwordHash = await bcrypt_1.default.hash(credentials.password, BCRYPT_ROUNDS);
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
    async login(credentials) {
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
        const passwordValid = await bcrypt_1.default.compare(credentials.password, user.passwordHash);
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
    async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const payload = jsonwebtoken_1.default.verify(refreshToken, environment_1.config.jwt.refreshSecret);
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
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            }
            throw error;
        }
    }
    async logout(refreshToken) {
        try {
            // Delete refresh token from database
            await this.refreshTokenRepository.deleteByToken(refreshToken);
        }
        catch (error) {
            // Silent fail if token doesn't exist
            console.warn('Failed to delete refresh token:', error);
        }
    }
    async verifyAccessToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
            return {
                userId: payload.userId,
                email: payload.email,
                username: payload.username,
            };
        }
        catch (error) {
            return null;
        }
    }
    generateAccessToken(userId, email, username) {
        const payload = {
            userId,
            email,
            username,
        };
        const options = {
            expiresIn: environment_1.config.jwt.accessExpiry,
        };
        return jsonwebtoken_1.default.sign(payload, environment_1.config.jwt.secret, options);
    }
    async generateRefreshToken(userId) {
        const tokenId = Math.random().toString(36).substring(2);
        const payload = {
            userId,
            tokenId,
        };
        const options = {
            expiresIn: environment_1.config.jwt.refreshExpiry,
        };
        const token = jsonwebtoken_1.default.sign(payload, environment_1.config.jwt.refreshSecret, options);
        // Calculate expiration date (7 days from now by default)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        // Store refresh token in database
        await this.refreshTokenRepository.create(userId, token, expiresAt);
        return token;
    }
    async generateTokens(userId, email, username) {
        const accessToken = this.generateAccessToken(userId, email, username);
        const refreshToken = await this.generateRefreshToken(userId);
        return {
            accessToken,
            refreshToken,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.UserRepository)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.RefreshTokenRepository)),
    __metadata("design:paramtypes", [Object, Object])
], AuthService);
//# sourceMappingURL=AuthService.js.map