import { Module, ClassSerializerInterceptor } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppConfigModule } from './app/config/config.module';
import { DomainModule } from './app/domain/domain.module';
import { ExceptionsFilter } from './app/core/filters/exceptions.filter';
import { RoleGuard } from './app/core/guards/roles.guard';
import { TokenModule } from './app/shared/token/token.module';

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
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
