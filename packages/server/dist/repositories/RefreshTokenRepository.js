"use strict";
/**
 * RefreshToken Repository Implementation
 * Manages refresh token data operations using Prisma
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenRepository = void 0;
const inversify_1 = require("inversify");
const client_1 = require("@prisma/client");
const types_1 = require("../container/types");
let RefreshTokenRepository = class RefreshTokenRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, token, expiresAt) {
        const refreshToken = await this.prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
        return refreshToken;
    }
    async findByToken(token) {
        const refreshToken = await this.prisma.refreshToken.findUnique({
            where: { token },
        });
        return refreshToken;
    }
    async findByUserId(userId) {
        const tokens = await this.prisma.refreshToken.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return tokens;
    }
    async deleteByToken(token) {
        await this.prisma.refreshToken.delete({
            where: { token },
        });
    }
    async deleteByUserId(userId) {
        await this.prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }
    async deleteExpired() {
        const result = await this.prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        return result.count;
    }
};
exports.RefreshTokenRepository = RefreshTokenRepository;
exports.RefreshTokenRepository = RefreshTokenRepository = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PrismaClient)),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], RefreshTokenRepository);
//# sourceMappingURL=RefreshTokenRepository.js.map