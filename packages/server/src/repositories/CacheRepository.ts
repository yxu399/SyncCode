import { injectable, inject } from 'inversify';
import { RedisClientType } from 'redis';
import { TYPES } from '../container/types';
import { ICacheRepository } from './interfaces/ICacheRepository';

@injectable()
export class CacheRepository implements ICacheRepository {
  constructor(
    @inject(TYPES.RedisClient) private redisClient: RedisClientType
  ) {}

  private async ensureConnection(): Promise<void> {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
  }

  // String operations
  async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    await this.ensureConnection();

    if (expireInSeconds) {
      await this.redisClient.setEx(key, expireInSeconds, value);
    } else {
      await this.redisClient.set(key, value);
    }
    console.log(`Redis: Set ${key}`);
  }

  async get(key: string): Promise<string | null> {
    await this.ensureConnection();

    const value = await this.redisClient.get(key);
    console.log(`Redis: Get ${key} = ${value ? 'found' : 'not found'}`);
    return value;
  }

  async delete(key: string): Promise<void> {
    await this.ensureConnection();

    await this.redisClient.del(key);
    console.log(`Redis: Deleted ${key}`);
  }

  async exists(key: string): Promise<boolean> {
    await this.ensureConnection();

    const result = await this.redisClient.exists(key);
    const exists = result > 0;
    console.log(`Redis: ${key} exists = ${exists}`);
    return exists;
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<void> {
    await this.ensureConnection();

    await this.redisClient.hSet(key, field, value);
    console.log(`Redis: HSET ${key} ${field}`);
  }

  async hget(key: string, field: string): Promise<string | null> {
    await this.ensureConnection();

    const value = await this.redisClient.hGet(key, field);
    console.log(`Redis: HGET ${key} ${field} = ${value ? 'found' : 'not found'}`);
    return value || null;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    await this.ensureConnection();

    const result = await this.redisClient.hGetAll(key);
    console.log(`Redis: HGETALL ${key} = ${Object.keys(result).length} fields`);
    return result;
  }

  async hdel(key: string, field: string): Promise<void> {
    await this.ensureConnection();

    await this.redisClient.hDel(key, field);
    console.log(`Redis: HDEL ${key} ${field}`);
  }

  async hlen(key: string): Promise<number> {
    await this.ensureConnection();

    const length = await this.redisClient.hLen(key);
    console.log(`Redis: HLEN ${key} = ${length}`);
    return length;
  }

  // Set operations
  async sadd(key: string, member: string): Promise<void> {
    await this.ensureConnection();

    await this.redisClient.sAdd(key, member);
    console.log(`Redis: SADD ${key} ${member}`);
  }

  async srem(key: string, member: string): Promise<void> {
    await this.ensureConnection();

    await this.redisClient.sRem(key, member);
    console.log(`Redis: SREM ${key} ${member}`);
  }

  async smembers(key: string): Promise<string[]> {
    await this.ensureConnection();

    const members = await this.redisClient.sMembers(key);
    console.log(`Redis: SMEMBERS ${key} = ${members.length} members`);
    return members;
  }

  async sismember(key: string, member: string): Promise<boolean> {
    await this.ensureConnection();

    const isMember = await this.redisClient.sIsMember(key, member);
    console.log(`Redis: SISMEMBER ${key} ${member} = ${isMember}`);
    return isMember;
  }

  // TTL operations
  async expire(key: string, seconds: number): Promise<void> {
    await this.ensureConnection();

    await this.redisClient.expire(key, seconds);
    console.log(`Redis: EXPIRE ${key} ${seconds}s`);
  }

  async ttl(key: string): Promise<number> {
    await this.ensureConnection();

    const ttl = await this.redisClient.ttl(key);
    console.log(`Redis: TTL ${key} = ${ttl}s`);
    return ttl;
  }
}