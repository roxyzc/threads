import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { Content, STATUS_CONTENT } from 'src/app/entities/content.entity';
import { GdriveService } from 'src/app/shared/gdrive/gdrive.service';
import { ImageContent } from 'src/app/entities/imageContent.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '../../user/services/user.service';
import { ResponseContent } from '../dtos/responseContent.dto';
import { STATUS_PROFILE } from 'src/app/entities/profile.entity';
import { LikeService } from './like.service';
import { CommentService } from './comment.service';

interface ICreateContent {
  content?: string;
  tags?: { name: string }[];
}

interface IUpdateContent {
  content?: string;
  status: STATUS_CONTENT;
}

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    private readonly entityManager: EntityManager,
    private readonly gdriveService: GdriveService,
    private readonly userService: UserService,
    private readonly likeService: LikeService,
    private readonly commentService: CommentService,
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
    idMe: string,
    limit: number,
    page: number,
    latest: boolean,
  ) {
    const limit_item = limit > 20 ? 20 : limit;
    const start = (page - 1) * limit_item;

    const findContent = this.queryContent().where(
      'content.userId = :userId AND content.status = :statusContent AND (profile.status = :statusProfile OR profile.status IS NULL)',
      {
        userId,
        statusContent: STATUS_CONTENT.public,
        statusProfile: STATUS_PROFILE.public,
      },
    );

    if (userId == idMe) {
      findContent.orWhere(
        'content.userId = :userId AND content.status <> :statusContent',
        {
          statusContent: STATUS_CONTENT.deleted,
          userId: idMe,
        },
      );
    }

    if (latest) {
      findContent.orderBy('content.createdAt', latest ? 'DESC' : 'ASC');
    }

    const [data, count] = await findContent
      .take(limit_item)
      .skip(start)
      .getManyAndCount();

    return { limit_item, start, data, count };
  }

  private async queryAllContent(
    limit: number,
    page: number,
    latest: boolean,
    search: string,
  ) {
    const limit_item = limit > 20 ? 20 : limit;
    const start = (page - 1) * limit_item;

    const query = this.queryContent().where(
      'content.status = :statusContent AND (profile.status = :statusProfile OR profile.status IS NULL)',
      {
        statusContent: STATUS_CONTENT.public,
        statusProfile: STATUS_PROFILE.public,
      },
    );

    if (search && search !== undefined) {
      query.andWhere(
        'MATCH (content.content) AGAINST (:s WITH QUERY EXPANSION)',
        {
          s: search,
        },
      );
    }

    if (latest) {
      query.orderBy('content.createdAt', latest ? 'DESC' : 'ASC');
    }

    const [data, count] = await query
      .take(limit_item)
      .skip(start)
      .getManyAndCount();
    return { limit_item, start, data, count };
  }

  private async queryContentByContentId(contentId: string, userId: string) {
    const data = await this.queryContent()
      .where('content.contentId = :contentId AND content.userId = :userId', {
        contentId,
        userId,
      })
      .orWhere(
        'content.contentId = :contentId AND content.status = :status_content AND profile.status = :status_profile',
        {
          contentId,
          status_content: STATUS_CONTENT.public,
          status_profile: STATUS_PROFILE.public,
        },
      )
      .getOne();
    return data;
  }

  private queryContent() {
    return this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.images', 'image')
      .leftJoinAndSelect('content.likes', 'like')
      .leftJoinAndSelect('content.tags', 'tag')
      .leftJoinAndSelect('content.comments', 'comment')
      .leftJoinAndSelect('comment.likes', 'clikes')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoin('comment.user', 'cuser')
      .leftJoin('content.user', 'user')
      .leftJoin('user.profile', 'profile')
      .leftJoin('profile.photo', 'photoProfile')
      .addSelect([
        'user.username',
        'profile.fullName',
        'photoProfile.url',
        'cuser.username',
      ]);
  }

  private mapResponseContent(data: Content[]) {
    return data.map(
      (content) =>
        new ResponseContent({
          ...content,
          username: content.user?.username,
          url: content.user?.profile?.photo?.url ?? '',
          fullName: content.user?.profile?.fullName,
          tags_content: content.tags.map((tag) => tag.name),
          images_content: content.images.map((image) => image.url),
          likes_content: content.likes.length,
          comment_content: content.comments.map((comment) => {
            return {
              commentId: comment.commentId,
              username: comment.user.username,
              text: comment.text,
              likes: comment.likes.length,
              replies: comment.replies.length,
              created_at: comment.createdAt,
            };
          }),
        }),
    );
  }

  public async getContentsByUserId(
    userId: string,
    idMe: string,
    limit?: number,
    page?: number,
    latest?: boolean,
  ) {
    try {
      if (page < 1 || limit < 1) {
        throw new BadRequestException(
          'page and pageSize must be positive integers.',
        );
      }

      const { limit_item, start, data, count } =
        await this.queryContentByUserId(userId, idMe, limit, page, latest);

      const filter_data = this.mapResponseContent(data);
      const pagination = this.createPagination(count, limit_item, page, start);

      return { pagination, filter_data };
    } catch (error) {
      throw error;
    }
  }

  public async getContent(
    limit: number,
    page: number,
    latest: boolean,
    search: string,
  ) {
    try {
      const { count, data, limit_item, start } = await this.queryAllContent(
        limit,
        page,
        latest,
        search,
      );

      const filter_data = this.mapResponseContent(data);
      const pagination = this.createPagination(count, limit_item, page, start);

      return { pagination, filter_data };
    } catch (error) {
      throw error;
    }
  }

  public async getContentByContentId(contentId: string, userId: string) {
    try {
      const content = await this.queryContentByContentId(contentId, userId);
      if (!content) {
        throw new NotFoundException('Content not found');
      }

      const filter_data = this.mapResponseContent([content]);
      return filter_data;
    } catch (error) {
      throw error;
    }
  }

  public async createContent(
    userId: string,
    params: ICreateContent,
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

  public async updateContent(
    userId: string,
    contentId: string,
    { content, status }: IUpdateContent,
  ) {
    try {
      await this.entityManager.transaction(async (entityManager) => {
        const findContent = await this.contentRepository
          .createQueryBuilder()
          .where('userId = :userId', { userId })
          .andWhere('contentId = :contentId', { contentId })
          .setLock('pessimistic_write')
          .getRawOne();

        if (!findContent) {
          throw new NotFoundException('Content not found');
        }

        await entityManager.update(
          Content,
          { contentId },
          {
            content: content ?? '',
            status,
          },
        );
      });
    } catch (error) {
      throw error;
    }
  }

  public async deleteContent(userId: string, contentId: string) {
    try {
      const findContent = await this.contentRepository
        .createQueryBuilder()
        .where('userId = :userId', { userId })
        .andWhere('contentId = :contentId', { contentId })
        .getRawOne();

      if (!findContent) {
        throw new NotFoundException('Content not found');
      }

      await this.entityManager.update(
        Content,
        { contentId },
        { status: STATUS_CONTENT.deleted },
      );
    } catch (error) {
      throw error;
    }
  }

  public async likeContent(contentId: string, userId: string) {
    try {
      const content = await this.contentRepository
        .createQueryBuilder('content')
        .where('contentId = :contentId', { contentId })
        .getOne();

      return await this.likeService.likeContent(content, userId);
    } catch (error) {
      throw error;
    }
  }

  private async getUser(userId: string) {
    try {
      const user = await this.userService.getByUserId(userId, [
        'user.userId',
        'user.username',
        'user.email',
      ]);

      if (!user) {
        throw new NotFoundException('user not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  public async commentContent(contentId: string, userId: string, text: string) {
    try {
      const user = await this.getUser(userId);
      const content = await this.contentRepository
        .createQueryBuilder('content')
        .where('contentId = :contentId', { contentId })
        .getOne();

      if (!content) {
        throw new NotFoundException('content not found');
      }

      await this.commentService.commentContent({ content, user, text });
    } catch (error) {
      throw error;
    }
  }

  public async repliesComment(
    parentComment: string,
    userId: string,
    text: string,
  ) {
    try {
      const user = await this.getUser(userId);
      await this.commentService.repliesComment({ text, user, parentComment });
    } catch (error) {
      throw error;
    }
  }
}
