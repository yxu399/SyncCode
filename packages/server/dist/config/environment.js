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
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    server: {
        port: parseInt(process.env.PORT || '5000', 10),
        nodeEnv: process.env.NODE_ENV || 'development'
    }
};
console.log('Environment loaded:', {
    redisUrl: exports.config.redis.url,
    port: exports.config.server.port,
    nodeEnv: exports.config.server.nodeEnv
});
//# sourceMappingURL=environment.js.map