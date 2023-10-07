import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { UserRoles } from 'src/app/entities/user.entity';

export class UserInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const { user, params } = context.switchToHttp().getRequest();
    if (user && user.userId && user.role) {
      if (user.userId !== params.id && user.role !== UserRoles.ADMIN) {
        throw new ForbiddenException();
      }
    } else {
      throw new ForbiddenException();
    }

    return next.handle();
  }
}
