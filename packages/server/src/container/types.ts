export const TYPES = {
  // Repositories
  CacheRepository: Symbol.for('CacheRepository'),
  UserRepository: Symbol.for('UserRepository'),
  RoomRepository: Symbol.for('RoomRepository'),

  // Services
  DocumentService: Symbol.for('DocumentService'),

  // Controllers
  SocketController: Symbol.for('SocketController'),

  // External dependencies
  RedisClient: Symbol.for('RedisClient'),
  PrismaClient: Symbol.for('PrismaClient')
};