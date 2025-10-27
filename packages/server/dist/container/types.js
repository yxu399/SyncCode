"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPES = void 0;
exports.TYPES = {
    // Repositories
    CacheRepository: Symbol.for('CacheRepository'),
    UserRepository: Symbol.for('UserRepository'),
    RoomRepository: Symbol.for('RoomRepository'),
    RefreshTokenRepository: Symbol.for('RefreshTokenRepository'),
    // Services
    DocumentService: Symbol.for('DocumentService'),
    AuthService: Symbol.for('AuthService'),
    MetricsService: Symbol.for('MetricsService'),
    // Controllers
    SocketController: Symbol.for('SocketController'),
    // External dependencies
    RedisClient: Symbol.for('RedisClient'),
    PrismaClient: Symbol.for('PrismaClient')
};
//# sourceMappingURL=types.js.map