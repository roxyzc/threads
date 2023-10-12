import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GENDER, Profile } from 'src/app/entities/profile.entity';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserActive } from 'src/app/entities/user.entity';
import { ResponseProfile } from '../dtos/response-profile.dto';
import { GdriveService } from 'src/app/shared/gdrive/gdrive.service';
import { Image } from 'src/app/entities/image.entity';

interface CreateProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  gender: GENDER;
}

interface UpdateProfile {
  gender?: GENDER;
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly entityManager: EntityManager,
    private readonly gdriveService: GdriveService,
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
          const url = `https://drive.google.com/uc?id=${fileId}`;
          const createImage = entityManager.create(Image, { fileId, url });
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
      console.error(error.message);
      throw error;
    }
  }

  public async getPhotoProfile(fileId: string) {
    try {
      const url = `https://drive.google.com/uc?id=${fileId}`;
      return url;
    } catch (error) {
      throw error;
    }
  }

  public async getProfile(userId: string): Promise<ResponseProfile> {
    try {
      const findProfile = await this.profileRepository
        .createQueryBuilder('profile')
        .where('profile.userId = :userId', { userId })
        .leftJoinAndSelect('profile.photo', 'image')
        .getOne();

      if (!findProfile) {
        throw new NotFoundException('Profile not found');
      }

      const data = new ResponseProfile({
        ...findProfile,
        photo: findProfile.photo?.url ?? null,
      });
      return data;
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }

  public async createProfile(
    userId: string,
    { firstName, fullName, gender, lastName }: CreateProfile,
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
        const profile = await this.lockProfile(userId, entityManager);

        if (payload.gender === profile.gender) {
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
