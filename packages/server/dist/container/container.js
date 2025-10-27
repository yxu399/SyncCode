"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
require("reflect-metadata");
const inversify_1 = require("inversify");
const redis_1 = require("redis");
const client_1 = require("@prisma/client");
const types_1 = require("./types");
const environment_1 = require("../config/environment");
const CacheRepository_1 = require("../repositories/CacheRepository");
const UserRepository_1 = require("../repositories/UserRepository");
const RoomRepository_1 = require("../repositories/RoomRepository");
const RefreshTokenRepository_1 = require("../repositories/RefreshTokenRepository");
const DocumentService_1 = require("../services/DocumentService");
const AuthService_1 = require("../services/AuthService");
const MetricsService_1 = require("../services/MetricsService");
const SocketController_1 = require("../controllers/SocketController");
exports.container = new inversify_1.Container();
// Configure Prisma Client
exports.container.bind(types_1.TYPES.PrismaClient).toDynamicValue(() => {
    const prisma = new client_1.PrismaClient({
        log: ['error', 'warn'],
    });
    console.log('✅ Prisma Client initialized');
    return prisma;
}).inSingletonScope();
// Configure Redis client
exports.container.bind(types_1.TYPES.RedisClient).toDynamicValue(() => {
    const client = (0, redis_1.createClient)({
        url: environment_1.config.redis.url
    });
    client.on('error', (err) => console.error('❌ Redis Client Error:', err));
    client.on('connect', () => console.log('✅ Connected to Redis'));
    client.on('ready', () => console.log('🚀 Redis client ready'));
    client.on('end', () => console.log('📪 Redis connection closed'));
    return client;
}).inSingletonScope();
// Bind repositories
exports.container.bind(types_1.TYPES.CacheRepository).to(CacheRepository_1.CacheRepository).inSingletonScope();
exports.container.bind(types_1.TYPES.UserRepository).to(UserRepository_1.UserRepository).inSingletonScope();
exports.container.bind(types_1.TYPES.RoomRepository).to(RoomRepository_1.RoomRepository).inSingletonScope();
exports.container.bind(types_1.TYPES.RefreshTokenRepository).to(RefreshTokenRepository_1.RefreshTokenRepository).inSingletonScope();
// Bind services
exports.container.bind(types_1.TYPES.DocumentService).to(DocumentService_1.DocumentService).inSingletonScope();
exports.container.bind(types_1.TYPES.AuthService).to(AuthService_1.AuthService).inSingletonScope();
exports.container.bind(types_1.TYPES.MetricsService).to(MetricsService_1.MetricsService).inSingletonScope();
// Bind controllers
exports.container.bind(types_1.TYPES.SocketController).to(SocketController_1.SocketController).inSingletonScope();
//# sourceMappingURL=container.js.map