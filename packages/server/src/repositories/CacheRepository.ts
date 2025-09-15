import { injectable, inject } from 'inversify';
import { RedisClientType } from 'redis';
import { TYPES } from '../container/types';
import { ICacheRepository } from './interfaces/ICacheRepository';

@injectable()
export class CacheRepository implements ICacheRepository {
  constructor(
    @inject(TYPES.RedisClient) private redisClient: RedisClientType
  ) {}

  async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
    
    if (expireInSeconds) {
      await this.redisClient.setEx(key, expireInSeconds, value);
    } else {
      await this.redisClient.set(key, value);
    }
    console.log(`Redis: Set ${key}`);
  }

  async get(key: string): Promise<string | null> {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
    
    const value = await this.redisClient.get(key);
    console.log(`Redis: Get ${key} = ${value ? 'found' : 'not found'}`);
    return value;
  }

  async delete(key: string): Promise<void> {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
    
    await this.redisClient.del(key);
    console.log(`Redis: Deleted ${key}`);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
    
    const result = await this.redisClient.exists(key);
    const exists = result > 0;
    console.log(`Redis: ${key} exists = ${exists}`);
    return exists;
  }
}