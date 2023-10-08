import { Module, ClassSerializerInterceptor } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppConfigModule } from './app/config/config.module';
import { DomainModule } from './app/domain/domain.module';
import { ExceptionsFilter } from './app/core/filters/exceptions.filter';
import { RoleGuard } from './app/core/guards/roles.guard';
import { TokenModule } from './app/shared/token/token.module';
import { RateLimiterGuard } from './app/core/guards/rateLimiter.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Module({
  imports: [AppConfigModule, DomainModule, TokenModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
