import { injectable } from 'inversify';
import { ICacheRepository } from './interfaces/ICacheRepository';

@injectable()
export class CacheRepository implements ICacheRepository {
  // For now, we'll use in-memory storage to test the DI pattern
  // Later we'll replace with actual Redis
  private cache: Map<string, { value: string; expires?: number }> = new Map();

  async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    const expires = expireInSeconds ? Date.now() + (expireInSeconds * 1000) : undefined;
    this.cache.set(key, { value, expires });
    console.log(`Cache: Set ${key} = ${value}`);
  }

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`Cache: Get ${key} = ${item.value}`);
    return item.value;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    console.log(`Cache: Deleted ${key}`);
  }

  async exists(key: string): Promise<boolean> {
    const exists = this.cache.has(key);
    console.log(`Cache: ${key} exists = ${exists}`);
    return exists;
  }
}