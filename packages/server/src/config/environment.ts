import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({
  path: path.join(__dirname, '../../../tools/.env')
});

export const config = {
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
  databaseUrl: config.database.url.replace(/:[^:@]+@/, ':****@'), // Hide password in logs
  redisUrl: config.redis.url,
  port: config.server.port,
  nodeEnv: config.server.nodeEnv,
  jwtConfigured: !!config.jwt.secret
});