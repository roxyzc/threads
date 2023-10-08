import {
  CacheOptionsFactory,
  CacheModuleAsyncOptions,
} from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleAsyncOptions {
    return {
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: Number(configService.get('cache.ttl', 30)),
        max: Number(configService.get('cache.limit', 10)),
      }),
      inject: [ConfigService],
    };
  }
}
