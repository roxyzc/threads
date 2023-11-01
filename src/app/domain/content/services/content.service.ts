import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { Content } from 'src/app/entities/content.entity';
import { GdriveService } from 'src/app/shared/gdrive/gdrive.service';
import { ImageContent } from 'src/app/entities/imageContent.entity';
import { User, UserActive } from 'src/app/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from 'src/app/entities/profile.entity';

interface createContent {
  content?: string;
  tags?: { name: string }[];
}

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly entityManager: EntityManager,
    private readonly gdriveService: GdriveService,
  ) {}

  private async lockUser(
    userId: string,
    entityManager: EntityManager,
  ): Promise<User> {
    const findUser = await entityManager
      .getRepository(User)
      .createQueryBuilder()
      .select('userId')
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

  public async getContentByContentId(contentId: string): Promise<Content> {
    try {
      const findContent = await this.contentRepository
        .createQueryBuilder('content')
        .where('contentId = :contentId', { contentId })
        .leftJoin('content.images', 'image')
        .leftJoin('content.tags', 'tag')
        .addSelect(['image.url', 'tag.name'])
        .getOne();

      if (!findContent) {
        throw new NotFoundException('Content not found');
      }

      return findContent;
    } catch (error) {
      throw error;
    }
  }

  public async getContentByUserId(userId: string): Promise<{
    profile: { fullName: string; image: string };
    data: Content[];
  }> {
    try {
      const data = await this.contentRepository
        .createQueryBuilder('content')
        .where('userId = :userId', { userId })
        .leftJoin('content.images', 'image')
        .leftJoin('content.tags', 'tag')
        .addSelect(['image.url', 'tag.name'])
        .getMany();

      const profile = await this.profileRepository
        .createQueryBuilder('profile')
        .select(['profile.fullName'])
        .where('userId = :userId', { userId })
        .leftJoin('profile.photo', 'image')
        .addSelect(['image.url'])
        .getOne();

      return {
        profile: {
          fullName: profile.fullName,
          image: profile.url,
        },
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  public async createContent(
    userId: string,
    params: createContent,
    images?: Array<Express.Multer.File>,
  ) {
    let fileId: string[];
    try {
      let folder = await this.gdriveService.searchFolder('Content');
      if (!folder) {
        folder = await this.gdriveService.createFolder('Content');
      }

      await this.entityManager.transaction(async (entityManager) => {
        const findUser = await this.lockUser(userId, entityManager);
        const createContent = entityManager.create(Content, {
          ...params,
          userId: findUser.userId,
        });
        const dataContent = await entityManager.save([createContent]);

        if (images && images.length > 0) {
          fileId = await this.gdriveService.saveFiles(images, folder.id);
          const createImage: ImageContent[] = [];
          for (const id of fileId) {
            const url = await this.gdriveService.getFileUrl(id);
            createImage.push(
              entityManager.create(ImageContent, {
                content: dataContent[0],
                fileId: id,
                url,
              }),
            );
          }
          await entityManager.save(createImage);
        }
      });
      return;
    } catch (error) {
      if (fileId && fileId.length > 0) {
        for (const id of fileId) {
          await this.gdriveService.deleteFile(id);
        }
      }
      throw error;
    }
  }
}
