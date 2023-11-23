import { Cache } from 'cache-manager';
import { RedisStore } from 'cache-manager-redis-store';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable({})
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache & RedisStore,
  ) {}

  async get<T = unknown>(key: string) {
    return await this.cache.get<T>(key);
  }

  async exists<T = unknown>(key: string): Promise<boolean> {
    const cachedValue = await this.cache.get<T>(key);
    return cachedValue !== null;
  }

  async set(key: string, value: any, seconds = 600) {
    return await this.cache.set(key, value, { ttl: seconds }, null);
  }

  async del(key: string) {
    return await this.cache.del(key);
  }
}
