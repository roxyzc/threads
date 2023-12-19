import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Followship } from 'src/app/entities/followship.entity';
import { EntityManager, Repository } from 'typeorm';
import { UserService } from './user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserActive } from 'src/app/entities/user.entity';
import { slug } from 'src/app/utils/slug.util';

type TField = 'followed' | 'follower';
type TAction = 'follow' | 'unfollow';

@Injectable()
export class FollowshipService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly userService: UserService,
    @InjectRepository(Followship)
    private readonly followshipRepository: Repository<Followship>,
  ) {}

  private async updateFollowship(
    target: User,
    follower: User,
    field: TField,
    action: TAction,
  ): Promise<void> {
    await this.entityManager.transaction(async (entityManager) => {
      const followship = await this.entityManager
        .getRepository(Followship)
        .createQueryBuilder('followship')
        .leftJoin('followship.follower', 'follower')
        .leftJoin('followship.followed', 'followed')
        .addSelect(['follower.userId', 'followed.userId'])
        .where(`followship.userId = :userId FOR UPDATE`, {
          userId: follower.userId,
        })
        .getOne();

      if (!followship) {
        throw new NotFoundException(
          `Followship not found for user with ID ${follower.userId}`,
        );
      }

      const targetIndex = followship[field].findIndex(
        (followedUser) => followedUser.userId === target.userId,
      );

      if (action === 'follow') {
        if (targetIndex !== -1) {
          throw new ConflictException('Target is already in the list');
        }

        followship[field] = followship[field] || [];
        followship[field + 'Count'] += 1;
        followship[field].push(target);
      } else {
        if (targetIndex === -1) {
          throw new ConflictException('Target is not in the list');
        }

        followship[field] = followship[field] || [];
        followship[field + 'Count'] -= 1;
        followship[field].splice(targetIndex, 1);
      }

      await entityManager.save(Followship, followship);
    });
  }

  private async checkTarget(usernameTarget: string): Promise<User> {
    try {
      const target = await this.userService.getUserByUsernameOrEmail(
        { username: usernameTarget },
        ['user.*'],
        true,
      );

      if (!target) {
        throw new NotFoundException(
          `User with username ${usernameTarget} not found`,
        );
      }

      if (target.active === UserActive.INACTIVE) {
        throw new BadRequestException(
          `User with username ${usernameTarget} is not active`,
        );
      }

      return target;
    } catch (error) {
      throw error;
    }
  }

  private async checkFollower(followerId: string): Promise<User> {
    try {
      const follower = await this.userService.getUserById(followerId);

      if (!follower) {
        throw new NotFoundException(`Follower with ID ${follower} not found`);
      }

      return follower;
    } catch (error) {
      throw error;
    }
  }

  public async actionFollowUserOrUnfollowUser(
    username: string,
    followerId: string,
    action: TAction,
  ) {
    try {
      const slugUsername = slug(username);
      const target = await this.checkTarget(slugUsername);

      if (target.userId === followerId) {
        throw new BadRequestException(
          'Bad request because the user is yourself',
        );
      }

      const follower = await this.checkFollower(followerId);
      await Promise.all([
        await this.updateFollowship(target, follower, 'followed', action),
        await this.updateFollowship(follower, target, 'follower', action),
      ]);
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }

  public async actionGetFollowerOrfollowed(username: string, action: TField) {
    try {
      let data: any;
      if (action === 'followed') {
        data = await this.followshipRepository
          .createQueryBuilder('followship')
          .leftJoin('followship.followed', 'followed')
          .leftJoin('followed.profile', 'profile')
          .leftJoin('profile.photo', 'image')
          .leftJoin('followship.user', 'user')
          .where('user.username = :username', { username })
          .addSelect([
            'followed.username',
            'user.username',
            'profile.fullName',
            'image.url',
          ])
          .limit(100)
          .getOne();

        // data = await this.entityManager.query(
        //   `
        //     SELECT f.*, u.username, fus.username as followed_username FROM followship AS f JOIN user AS u ON u.userId = f.userId JOIN followed_user as fu ON f.followerId = fu.followshipFollowerId JOIN user as fus ON fu.userUserId = fus.userId WHERE u.username = ?
        //   `,
        //   [username],
        // );
      }

      if (action === 'follower') {
        data = await this.followshipRepository
          .createQueryBuilder('followship')
          .leftJoin('followship.follower', 'follower')
          .leftJoin('follower.profile', 'profile')
          .leftJoin('profile.photo', 'image')
          .leftJoin('followship.user', 'user')
          .where('user.username = :username', { username })
          .addSelect([
            'follower.username',
            'user.username',
            'profile.fullName',
            'image.url',
          ])
          .limit(100)
          .getOne();
      }

      if (!data) {
        throw new NotFoundException('Data not found');
      }

      return data[action];
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }
}
