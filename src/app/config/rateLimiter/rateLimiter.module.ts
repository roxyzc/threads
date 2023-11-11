import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: Number(configService.get('throttler.ttl', 300000)),
          limit: Number(configService.get('throttler.limit', 1000)),
        },
      ],
    }),
  ],
})
export class RateLimiterModule {}
