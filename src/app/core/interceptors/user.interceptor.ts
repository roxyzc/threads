import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { UserRoles } from 'src/app/entities/user.entity';

export class UserInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const { user, query } = context.switchToHttp().getRequest();
    if (user && user.userId && user.role) {
      if (user.userId !== query.id && user.role !== UserRoles.ADMIN) {
        throw new ForbiddenException('Request invalid');
      }
    } else {
      throw new ForbiddenException('Request invalid');
    }

    return next.handle();
  }
}
