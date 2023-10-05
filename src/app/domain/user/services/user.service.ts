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
    const selectColumns = select || ['*'];
    return this.userRepository
      .createQueryBuilder()
      .where('userId = :userId', { userId })
      .select(selectColumns)
      .getRawOne();
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

    return await queryBuilder
      .leftJoin('user.token', 'token')
      .addSelect(['token.accessToken', 'token.tokenId'])
      .getOne();
  }
}
