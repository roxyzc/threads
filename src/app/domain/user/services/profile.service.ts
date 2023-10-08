import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { GENDER, Profile } from 'src/app/entities/profile.entity';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserActive } from 'src/app/entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface CreateProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  gender: GENDER;
  photo?: string;
}

interface UpdateProfile {
  gender?: GENDER;
  photo?: string;
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly entityManager: EntityManager,
  ) {}

  private async lockUser(userId: string, entityManager: EntityManager) {
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

  private async LockProfile(userId: string, entityManager: EntityManager) {
    const findProfile = await entityManager
      .getRepository(Profile)
      .createQueryBuilder('profile')
      .select('profile.*')
      .where('profile.userId = :userId', { userId })
      .setLock('pessimistic_write')
      .getRawOne();

    if (!findProfile) {
      throw new NotFoundException('User not found');
    }

    return findProfile;
  }

  public async getProfile(userId: string): Promise<Profile> {
    try {
      const data = await this.profileRepository
        .createQueryBuilder('profile')
        .select('profile.*')
        .where('profile.userId = :userId', { userId })
        .getRawOne();

      if (!data) {
        throw new NotFoundException('Profile not found');
      }

      await this.cacheManager.set(`profile=${userId}`, data);
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
        const user = await this.lockUser(userId, entityManager);

        try {
          const createProfile = entityManager.create(Profile, {
            firstName,
            gender,
            lastName,
            fullName,
            photo,
            user,
          });
          await entityManager.save<Profile>([createProfile]);
        } catch (error) {
          throw new ConflictException('profile already exists');
        }
      });
    } catch (error) {
      throw error;
    }
  }

  public async updateProfile(
    userId: string,
    payload: UpdateProfile,
  ): Promise<void> {
    try {
      await this.entityManager.transaction(async (entityManager) => {
        const profile = await this.LockProfile(userId, entityManager);

        if (
          (payload.gender === profile.gender && !payload?.photo) ||
          (payload.photo === profile.photo && !payload?.gender) ||
          (payload.photo === profile.photo && payload.gender === profile.gender)
        ) {
          throw new BadRequestException('The data is the same as the profile.');
        }

        try {
          await entityManager.update(
            Profile,
            { profileId: profile.profileId },
            payload,
          );
        } catch (error) {
          throw new BadRequestException(error.message);
        }
      });
    } catch (error) {
      throw error;
    }
  }
}