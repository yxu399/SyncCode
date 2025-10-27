"use strict";
/**
 * User Repository Implementation
 * Manages user data operations using Prisma
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
exports.UserRepository = void 0;
const inversify_1 = require("inversify");
const client_1 = require("@prisma/client");
const types_1 = require("../container/types");
let UserRepository = class UserRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                passwordHash: data.passwordHash,
            },
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    }
    async findByEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    }
    async findByUsername(username) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    }
    async findByIdWithPassword(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        return user;
    }
    async findByEmailWithPassword(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        return user;
    }
    async update(id, data) {
        const user = await this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    }
    async delete(id) {
        await this.prisma.user.delete({
            where: { id },
        });
    }
    async emailExists(email) {
        const count = await this.prisma.user.count({
            where: { email },
        });
        return count > 0;
    }
    async usernameExists(username) {
        const count = await this.prisma.user.count({
            where: { username },
        });
        return count > 0;
    }
};
exports.UserRepository = UserRepository;
exports.UserRepository = UserRepository = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PrismaClient)),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], UserRepository);
//# sourceMappingURL=UserRepository.js.map