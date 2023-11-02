import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { Content } from 'src/app/entities/content.entity';
import { GdriveService } from 'src/app/shared/gdrive/gdrive.service';
import { ImageContent } from 'src/app/entities/imageContent.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '../../user/services/user.service';
import { ResponseContent } from '../dtos/responseContent.dto';

interface createContent {
  content?: string;
  tags?: { name: string }[];
}

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    private readonly entityManager: EntityManager,
    private readonly gdriveService: GdriveService,
    private readonly userService: UserService,
  ) {}

  private createPagination(
    totalData: number,
    limit: number,
    page: number,
    start: number,
  ) {
    const pagination = {};
    const end = page * limit;

    Object.assign(pagination, {
      totalData,
      totalPage: Math.ceil(totalData / limit),
      currentPage: page,
    });

    if (end < totalData) {
      Object.assign(pagination, {
        next: {
          page: page + 1,
          limit_item: limit,
          remaining: totalData - (start + limit),
        },
      });
    }

    if (start > 0 && page - Math.ceil(totalData / limit) < 1) {
      Object.assign(pagination, {
        prev: {
          page: page - 1,
          limit,
          ramaining: totalData - (totalData - start),
        },
      });
    }

    if (page - Math.ceil(totalData / limit) === 1) {
      Object.assign(pagination, {
        prev: { remaining: totalData },
      });
    }

    return pagination;
  }

  private async queryContentByUserId(
    userId: string,
    limit: number,
    page: number,
  ) {
    const limit_item = limit > 20 ? 20 : limit;
    const start = (page - 1) * limit_item;
    const [data, count] = await this.queryContent()
      .where('content.userId = :userId', { userId })
      .take(limit_item)
      .skip(start)
      .getManyAndCount();
    return { limit_item, start, data, count };
  }

  private async queryAllContent(limit: number, page: number) {
    const limit_item = limit > 20 ? 20 : limit;
    const start = (page - 1) * limit_item;
    const [data, count] = await this.queryContent()
      .take(limit_item)
      .skip(start)
      .getManyAndCount();
    return { limit_item, start, data, count };
  }

  private async qqueryContentByContentId(contentId: string) {
    const data = await this.queryContent()
      .where('content.contentId = :contentId', { contentId })
      .getOne();
    return data;
  }

  private queryContent() {
    return this.contentRepository
      .createQueryBuilder('content')
      .leftJoin('content.images', 'image')
      .leftJoin('content.tags', 'tag')
      .leftJoin('content.user', 'user')
      .leftJoin('user.profile', 'profile')
      .leftJoin('profile.photo', 'photoProfile')
      .addSelect([
        'image.url',
        'tag.name',
        'user.username',
        'profile.fullName',
        'photoProfile.url',
      ]);
  }

  private mapResponseContent(data: Content[]) {
    return data.map(
      (content) =>
        new ResponseContent({
          ...content,
          username: content.user.username,
          url: content.user.profile.photo.url,
          fullName: content.user.profile.fullName,
          tags_content: content.tags.map((tag) => tag.name),
          images_content: content.images.map((image) => image.url),
        }),
    );
  }

  public async getContentsByUserId(
    userId: string,
    limit?: number,
    page?: number,
  ) {
    try {
      if (page < 1 || limit < 1) {
        throw new BadRequestException(
          'page and pageSize must be positive integers.',
        );
      }

      const { limit_item, start, data, count } =
        await this.queryContentByUserId(userId, limit, page);
      const filter_data = this.mapResponseContent(data);
      const pagination = this.createPagination(count, limit_item, page, start);

      return { pagination, filter_data };
    } catch (error) {
      throw error;
    }
  }

  public async getContent(limit: number, page: number) {
    try {
      const { count, data, limit_item, start } = await this.queryAllContent(
        limit,
        page,
      );

      const filter_data = this.mapResponseContent(data);
      const pagination = this.createPagination(count, limit_item, page, start);

      return { pagination, filter_data };
    } catch (error) {
      throw error;
    }
  }

  public async getContentByContentId(contentId: string) {
    try {
      const content = await this.qqueryContentByContentId(contentId);
      const filter_data = this.mapResponseContent([content]);

      return filter_data;
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
        const user = await this.userService.lockUser(userId, entityManager);
        if (!user) {
          throw new NotFoundException('User not found');
        }
        const createContent = entityManager.create(Content, {
          ...params,
          user,
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
