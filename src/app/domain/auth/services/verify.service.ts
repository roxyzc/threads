import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  GoneException,
  ConflictException,
  Scope,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { User, UserActive } from 'src/app/entities/user.entity';
import { comparePassword, hash } from 'src/app/utils/hash.util';
import { UserService } from '../../user/services/user.service';

@Injectable({ scope: Scope.DEFAULT })
export class VerifyService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly userService: UserService,
  ) {}

  async verifyUser(payload: { email: string; expiredAt: number }) {
    const currentTime = new Date().getTime();
    try {
      const findUser = await this.userService.getUserByUsernameOrEmail(
        { email: payload.email },
        ['user.userId', 'user.active'],
      );

      if (!findUser) {
        throw new NotFoundException('User not found');
      }

      if (findUser.active === UserActive.ACTIVE) {
        throw new BadRequestException('The user is already active');
      }

      if (payload.expiredAt <= currentTime) {
        throw new GoneException('Verify expired');
      }

      await this.entityManager.update(
        User,
        { email: payload.email },
        { active: UserActive.ACTIVE },
      );
    } catch (error) {
      throw error;
    }
  }

  async resetPasswordUser(
    newPassword: string,
    payload: {
      email: string;
      expiredAt: string;
    },
  ): Promise<void> {
    try {
      await this.entityManager.transaction(async (entityManager) => {
        const findUser = await entityManager
          .getRepository(User)
          .createQueryBuilder()
          .select(['active', 'password'])
          .where('email = :email', { email: payload.email })
          .setLock('pessimistic_write')
          .getRawOne();

        if (!findUser) {
          throw new NotFoundException('User not found');
        }

        if (findUser.active === UserActive.INACTIVE) {
          throw new ForbiddenException('User is inactive');
        }

        const isMatch = await comparePassword(newPassword, findUser.password);

        if (isMatch) {
          throw new ConflictException('New password is same as old password');
        }

        const hashPassword = await hash(newPassword);
        await entityManager.update(
          User,
          { email: payload.email },
          { password: hashPassword },
        );
      });
    } catch (error) {
      throw error;
    }
  }
}
