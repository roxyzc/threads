import {
  ExecutionContext,
  NotFoundException,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

export const GetUser = createParamDecorator(
  async (_data: unknown, context: ExecutionContext) => {
    const { user } = context.switchToHttp().getRequest();
    try {
      if (!user) {
        throw new NotFoundException();
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  },
);
