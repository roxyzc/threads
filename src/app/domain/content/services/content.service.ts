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

interface createContent {
  content?: string;
}

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    private readonly entityManager: EntityManager,
    private readonly gdriveService: GdriveService,
  ) {}

  private async lockUser(userId: string, entityManager: EntityManager) {
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
    return await this.contentRepository.findOne({
      where: {
        contentId: contentId,
      },
      relations: ['images'],
    });
  }

  public async getContentByUserId(userId: string): Promise<Content[]> {
    return await this.contentRepository.find({
      where: {
        userId,
      },
      relations: ['images'],
    });
  }

  public async createContent(
    userId: string,
    { content }: createContent,
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
          content,
          userId: findUser.userId,
        });
        const dataContent = await entityManager.save(createContent);

        if (images && images.length > 0) {
          fileId = await this.gdriveService.saveFiles(images, folder.id);
          const createImage: ImageContent[] = [];
          for (const id of fileId) {
            const url = await this.gdriveService.getFileUrl(id);
            createImage.push(
              entityManager.create(ImageContent, {
                content: dataContent,
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
