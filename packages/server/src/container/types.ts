export const TYPES = {
  // Repositories
  CacheRepository: Symbol.for('CacheRepository'),
  UserRepository: Symbol.for('UserRepository'),
  RoomRepository: Symbol.for('RoomRepository'),
  RefreshTokenRepository: Symbol.for('RefreshTokenRepository'),

  // Services
  DocumentService: Symbol.for('DocumentService'),
  AuthService: Symbol.for('AuthService'),
  MetricsService: Symbol.for('MetricsService'),
  PresenceService: Symbol.for('PresenceService'),

  // Controllers
  SocketController: Symbol.for('SocketController'),

  // External dependencies
  RedisClient: Symbol.for('RedisClient'),
  PrismaClient: Symbol.for('PrismaClient')
};