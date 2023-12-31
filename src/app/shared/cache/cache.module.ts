import { Module } from '@nestjs/common';
import { CacheModule as Cache } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

@Module({
  imports: [
    Cache.registerAsync({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => ({
        max: Number(configService.get('cache.limit', 10)),
        store: (): any =>
          redisStore({
            commandsQueueMaxLength: 10_000,
            password: configService.get('redis.password'),
            socket: {
              tls: true,
              host: configService.get('redis.host'),
              port: Number(configService.get('redis.port')),
            },
          }),
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
