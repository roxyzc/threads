import { Module } from '@nestjs/common';
import config from './index';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RateLimiterModule } from './rateLimiter/rateLimiter.module';

const envFile =
  process.env.NODE_ENV === 'production'
    ? '.production.env'
    : '.development.env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFile,
      cache: true,
      load: [config],
      expandVariables: true,
    }),
    DatabaseModule,
    RateLimiterModule,
  ],
})
export class AppConfigModule {}
