export interface ICacheRepository {
  // String operations
  set(key: string, value: string, expireInSeconds?: number): Promise<void>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;

  // Hash operations
  hset(key: string, field: string, value: string): Promise<void>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hdel(key: string, field: string): Promise<void>;
  hlen(key: string): Promise<number>;

  // Set operations
  sadd(key: string, member: string): Promise<void>;
  srem(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, member: string): Promise<boolean>;

  // TTL operations
  expire(key: string, seconds: number): Promise<void>;
  ttl(key: string): Promise<number>;
}