import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User, UserActive } from 'src/app/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  public async lockUser(userId: string, entityManager: EntityManager) {
    const findUser = await entityManager
      .getRepository(User)
      .createQueryBuilder()
      .select('user.*')
      .where('userId = :userId', { userId })
      .setLock('pessimistic_write')
      .getRawOne();

    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    if (findUser.active === UserActive.INACTIVE) {
      throw new UnauthorizedException('user inactive');
    }
    return findUser;
  }

  public async getUserById(userId: string, select?: string[]): Promise<User> {
    const selectColumns = select;
    const user = this.userRepository
      .createQueryBuilder('user')
      .where('user.userId = :userId', { userId });

    if (selectColumns && selectColumns.length > 0) {
      user.select(selectColumns);
    } else {
      user.addSelect('user.*');
    }

    return await user
      .leftJoin('user.profile', 'profile')
      .leftJoin('profile.photo', 'image')
      .addSelect([
        'profile.fullName',
        'profile.gender',
        'profile.photo',
        'image.url',
      ])
      .getOne();
  }

  public async getUserByUsernameOrEmail(
    { email, username }: { email: string; username?: string },
    select?: string[],
    raw = false,
  ): Promise<User> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('email = :email', { email });

    if (select && select.length > 0) {
      queryBuilder.select(select);
    } else {
      queryBuilder.addSelect('user.*');
    }

    if (username) {
      queryBuilder.andWhere('username = :username', { username });
    }

    if (raw) {
      return await queryBuilder.getRawOne();
    }

    const data = await queryBuilder
      .leftJoin('user.token', 'token')
      .addSelect(['token.accessToken', 'token.tokenId'])
      .getOne();

    return data;
  }
}
