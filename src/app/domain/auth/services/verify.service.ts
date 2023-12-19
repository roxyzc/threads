import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  GoneException,
  ConflictException,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { User, UserActive } from 'src/app/entities/user.entity';
import { comparePassword, hash } from 'src/app/utils/hash.util';
import { UserService } from '../../user/services/user.service';
import { Followship } from 'src/app/entities/followship.entity';

@Injectable({ scope: Scope.DEFAULT })
export class VerifyService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly userService: UserService,
  ) {}

  async verifyUser(payload: {
    email: string;
    type: string;
    expiredAt: number;
  }) {
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

      if (payload.type !== 'sendVerifyUser') {
        throw new UnauthorizedException('Token ilegal');
      }

      if (payload.expiredAt <= currentTime) {
        throw new GoneException('Verify expired');
      }

      await this.entityManager.transaction(async (entityManager) => {
        const createFollower = entityManager.create(Followship, {
          userId: findUser.userId,
        });
        await Promise.all([
          entityManager.save(createFollower),
          entityManager.update(
            User,
            { email: payload.email },
            { active: UserActive.ACTIVE },
          ),
        ]);
        return;
      });
    } catch (error) {
      throw error;
    }
  }

  async resetPasswordUser(
    newPassword: string,
    payload: {
      email: string;
      type: string;
      expiredAt: number;
    },
  ): Promise<void> {
    const currentTime = new Date().getTime();
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

        if (payload.type !== 'sendResetPassword') {
          throw new UnauthorizedException('Token ilegal');
        }

        if (payload.expiredAt <= currentTime) {
          throw new GoneException('Verify expired');
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
