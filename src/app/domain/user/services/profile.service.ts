import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GENDER, Profile } from 'src/app/entities/profile.entity';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserActive } from 'src/app/entities/user.entity';

interface CreateProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  gender: GENDER;
  photo?: string;
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly entityManager: EntityManager,
  ) {}

  public async getProfile(userId: string): Promise<Profile> {
    try {
      const data = await this.profileRepository
        .createQueryBuilder('profile')
        .where('profile.userId = :userId', { userId })
        .getRawOne();

      if (!data) {
        throw new NotFoundException('Profile not found');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  public async createProfile(
    userId: string,
    { firstName, fullName, gender, lastName, photo }: CreateProfile,
  ): Promise<void> {
    try {
      await this.entityManager.transaction(async (entityManager) => {
        const findUser = await entityManager
          .getRepository(User)
          .createQueryBuilder()
          .select(['active', 'password'])
          .where('userId = :userId', { userId })
          .setLock('pessimistic_write')
          .getRawOne();

        if (!findUser) {
          throw new NotFoundException('User not found');
        }

        if (findUser.active === UserActive.INACTIVE) {
          throw new UnauthorizedException('user inactive');
        }

        const createProfile = entityManager.create(Profile, {
          user: findUser,
          firstName,
          gender,
          lastName,
          fullName,
          photo,
        });

        try {
          await entityManager.save([createProfile]);
        } catch (error) {
          throw new ConflictException('profile already exists');
        }
      });
    } catch (error) {
      throw error;
    }
  }
}
