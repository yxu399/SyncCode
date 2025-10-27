import 'reflect-metadata';
import { Container } from 'inversify';
import { createClient, RedisClientType } from 'redis';
import { PrismaClient } from '@prisma/client';
import { TYPES } from './types';
import { config } from '../config/environment';
import { ICacheRepository } from '../repositories/interfaces/ICacheRepository';
import { CacheRepository } from '../repositories/CacheRepository';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { UserRepository } from '../repositories/UserRepository';
import { IRoomRepository } from '../repositories/interfaces/IRoomRepository';
import { RoomRepository } from '../repositories/RoomRepository';
import { IRefreshTokenRepository } from '../repositories/interfaces/IRefreshTokenRepository';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository';
import { IDocumentService } from '../services/interfaces/IDocumentService';
import { DocumentService } from '../services/DocumentService';
import { IAuthService } from '../services/interfaces/IAuthService';
import { AuthService } from '../services/AuthService';
import { IMetricsService } from '../services/interfaces/IMetricsService';
import { MetricsService } from '../services/MetricsService';
import { IPresenceService } from '../services/interfaces/IPresenceService';
import { PresenceService } from '../services/PresenceService';
import { SocketController } from '../controllers/SocketController';

export const container = new Container();

// Configure Prisma Client
container.bind<PrismaClient>(TYPES.PrismaClient).toDynamicValue(() => {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  console.log('✅ Prisma Client initialized');

  return prisma;
}).inSingletonScope();

// Configure Redis client
container.bind<RedisClientType>(TYPES.RedisClient).toDynamicValue(() => {
  const client = createClient({
    url: config.redis.url
  });

  client.on('error', (err) => console.error('❌ Redis Client Error:', err));
  client.on('connect', () => console.log('✅ Connected to Redis'));
  client.on('ready', () => console.log('🚀 Redis client ready'));
  client.on('end', () => console.log('📪 Redis connection closed'));

  return client as RedisClientType;
}).inSingletonScope();

// Bind repositories
container.bind<ICacheRepository>(TYPES.CacheRepository).to(CacheRepository).inSingletonScope();
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
container.bind<IRoomRepository>(TYPES.RoomRepository).to(RoomRepository).inSingletonScope();
container.bind<IRefreshTokenRepository>(TYPES.RefreshTokenRepository).to(RefreshTokenRepository).inSingletonScope();

// Bind services
container.bind<IDocumentService>(TYPES.DocumentService).to(DocumentService).inSingletonScope();
container.bind<IAuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
container.bind<IMetricsService>(TYPES.MetricsService).to(MetricsService).inSingletonScope();
container.bind<IPresenceService>(TYPES.PresenceService).to(PresenceService).inSingletonScope();

// Bind controllers
container.bind<SocketController>(TYPES.SocketController).to(SocketController).inSingletonScope();