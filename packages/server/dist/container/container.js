"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
require("reflect-metadata");
const inversify_1 = require("inversify");
const redis_1 = require("redis");
const types_1 = require("./types");
const environment_1 = require("../config/environment");
const CacheRepository_1 = require("../repositories/CacheRepository");
const DocumentService_1 = require("../services/DocumentService");
const SocketController_1 = require("../controllers/SocketController");
exports.container = new inversify_1.Container();
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
// Bind services
exports.container.bind(types_1.TYPES.DocumentService).to(DocumentService_1.DocumentService).inSingletonScope();
// Bind controllers
exports.container.bind(types_1.TYPES.SocketController).to(SocketController_1.SocketController).inSingletonScope();
//# sourceMappingURL=container.js.map