import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({
  path: path.join(__dirname, '../../../tools/.env')
});

export const config = {
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development'
  }
};

console.log('Environment loaded:', {
  redisUrl: config.redis.url,
  port: config.server.port,
  nodeEnv: config.server.nodeEnv
});