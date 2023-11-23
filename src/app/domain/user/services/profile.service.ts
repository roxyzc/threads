import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GENDER,
  Profile,
  STATUS_PROFILE,
} from 'src/app/entities/profile.entity';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseProfile } from '../dtos/response-profile.dto';
import { GdriveService } from 'src/app/shared/gdrive/gdrive.service';
import { ImageProfile } from 'src/app/entities/imageProfile.entity';
import { UserService } from './user.service';
import { CacheService } from 'src/app/shared/cache/cache.service';

interface CreateProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  gender: GENDER;
}

interface UpdateProfile {
  gender: GENDER;
  url: string;
  firstName: string;
  lastName: string;
  bio: string;
  status: STATUS_PROFILE;
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly userService: UserService,
    private readonly entityManager: EntityManager,
    private readonly gdriveService: GdriveService,
    private readonly cacheService: CacheService,
  ) {}

  private async getCachedProfile(userId: string) {
    const cacheKey = `profile=${userId}`;
    const cacheProfile = await this.cacheService.get<ResponseProfile>(cacheKey);
    if (cacheProfile) {
      return cacheProfile;
    }
  }

  private async lockProfile(userId: string, entityManager: EntityManager) {
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

  private async lockImage(fileId: string, entityManager: EntityManager) {
    const findImage = await entityManager
      .getRepository(Image)
      .createQueryBuilder('image_profile')
      .select('image.*')
      .where('image.fileId = :fileId', { fileId })
      .setLock('pessimistic_write')
      .getRawOne();

    if (!findImage) {
      throw new NotFoundException('Image not found');
    }

    return findImage;
  }

  private queryProfile() {
    return this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.photo', 'image');
  }

  private responseProfile(profile: Profile) {
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return new ResponseProfile({
      ...profile,
      photo: profile.photo?.url ?? null,
    });
  }

  private async getPhotoProfile(fileId: string) {
    try {
      const url = `https://drive.google.com/uc?id=${fileId}`;
      return url;
    } catch (error) {
      throw error;
    }
  }

  public async sendPhotoProfile(file: Express.Multer.File, userId: string) {
    let fileId: string;

    try {
      const folderName = 'Picture';
      let folder = await this.gdriveService.searchFolder(folderName);
      if (!folder) {
        folder = await this.gdriveService.createFolder(folderName);
      }

      const data = await this.entityManager.transaction(
        async (entityManager) => {
          const lockProfile = await this.lockProfile(userId, entityManager);
          if (lockProfile.imageId) {
            throw new ConflictException();
          }

          fileId = await this.gdriveService.saveFile(file, folder.id);
          const url = await this.getPhotoProfile(fileId);
          const createImage = entityManager.create(ImageProfile, {
            fileId,
            url,
          });
          const image = await entityManager.save(createImage);
          await entityManager.update(
            Profile,
            { user: userId },
            { photo: image },
          );
          return {
            fileId,
            url,
          };
        },
      );
      return data;
    } catch (error) {
      await this.gdriveService.deleteFile(fileId);
      throw error;
    }
  }

  public async updatePhotoProfile(file: Express.Multer.File, fileId: string) {
    try {
      await this.gdriveService.updateFile(file, fileId);
    } catch (error) {
      throw error;
    }
  }

  public async deletePhotoProfile(fileId: string): Promise<void> {
    try {
      await this.entityManager.transaction(async (entityManager) => {
        await this.lockImage(fileId, entityManager);
        await entityManager.delete(Image, { fileId });
        await this.gdriveService.deleteFile(fileId);
      });
      return;
    } catch (error) {
      throw error;
    }
  }

  public async getProfile(
    id: string,
    userId: string,
  ): Promise<ResponseProfile> {
    try {
      const cache = await this.getCachedProfile(id);
      if (cache) {
        return cache;
      }

      const findProfile = this.queryProfile().where(
        'profile.userId = :userId',
        { userId: id },
      );

      if (userId !== id) {
        findProfile.andWhere('profile.status = :status', {
          status: STATUS_PROFILE.public,
        });
      }

      const data = await findProfile.getOne();
      const response = this.responseProfile(data);
      await this.cacheService.set(`profile=${id}`, response, 30);
      return response;
    } catch (error) {
      throw error;
    }
  }

  public async createProfile(
    userId: string,
    { firstName, fullName, gender, lastName }: CreateProfile,
  ): Promise<void> {
    try {
      await this.entityManager.transaction(async (entityManager) => {
        const user = await this.userService.lockUser(userId, entityManager);

        try {
          const createProfile = entityManager.create(Profile, {
            firstName: firstName.toLowerCase(),
            lastName: lastName ? lastName.toLowerCase() : lastName,
            fullName: fullName.toLowerCase(),
            gender,
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
    payload: Partial<UpdateProfile>,
  ): Promise<void> {
    try {
      await this.entityManager.transaction(async (entityManager) => {
        const profile = await this.lockProfile(userId, entityManager);
        const fullName = payload.lastName
          ? `${payload.firstName} ${payload.lastName}`
          : `${payload.firstName}`;
        try {
          await entityManager.update(
            Profile,
            { profileId: profile.profileId },
            {
              ...payload,
              lastName: payload.lastName
                ? payload.lastName.toLowerCase()
                : null,
              fullName: fullName.toLowerCase(),
            },
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
