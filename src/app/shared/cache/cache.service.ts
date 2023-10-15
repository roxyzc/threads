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
    return this.cache.get<T>(key);
  }

  async set(key: string, value: any, seconds = 600) {
    return this.cache.set(key, value, { ttl: seconds }, null);
  }

  async del(key: string) {
    return this.cache.del(key);
  }
}
