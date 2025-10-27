"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({
    path: path_1.default.join(__dirname, '../../../tools/.env')
});
exports.config = {
    database: {
        url: process.env.DATABASE_URL || 'postgresql://synccode_user:synccode_dev_password@localhost:5433/synccode_dev'
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    server: {
        port: parseInt(process.env.PORT || '5000', 10),
        nodeEnv: process.env.NODE_ENV || 'development'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_change_in_production',
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
    }
};
console.log('Environment loaded:', {
    databaseUrl: exports.config.database.url.replace(/:[^:@]+@/, ':****@'), // Hide password in logs
    redisUrl: exports.config.redis.url,
    port: exports.config.server.port,
    nodeEnv: exports.config.server.nodeEnv,
    jwtConfigured: !!exports.config.jwt.secret
});
//# sourceMappingURL=environment.js.map