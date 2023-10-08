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
      useFactory: (configService: ConfigService) => ({
        ttl: Number(configService.get('config_ttl', 30)),
        max: Number(configService.get('config_max', 10)),
      }),
      inject: [ConfigService],
    };
  }
}
