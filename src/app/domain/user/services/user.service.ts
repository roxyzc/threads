import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/app/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

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
