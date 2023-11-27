import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment, STATUS_COMMENT } from 'src/app/entities/comment.entity';
import { Content, STATUS_CONTENT } from 'src/app/entities/content.entity';
import { User } from 'src/app/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { UserService } from '../../user/services/user.service';
import { ContentService } from './content.service';
import { ResponseCommentDto } from '../dtos/responseComment.dto';
import { LikeService } from './like.service';

interface ICommentContent {
  content: Content;
  text: string;
  user: User;
}

interface IRepliesComment {
  parentComment: Comment;
  text: string;
  user: User;
}

interface IUpdateComment {
  userId: string;
  commentId: string;
  text: string;
}

const THIRTY_MINUTES_IN_MILLISECONDS = 30 * 60 * 1000;

@Injectable()
export class CommentService {
  private logger = new Logger(CommentService.name);

  constructor(
    private readonly entityManager: EntityManager,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly userService: UserService,
    private readonly contentService: ContentService,
    private readonly likeService: LikeService,
  ) {}

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

  private async createContent(data: ICommentContent | IRepliesComment) {
    try {
      const comment = this.entityManager.create(Comment, {
        ...data,
      });

      await this.entityManager.save(comment);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  private queryComment() {
    return this.commentRepository.createQueryBuilder('comment');
  }

  private queryCommentById(commentId: string) {
    return this.queryComment()
      .leftJoinAndSelect('comment.content', 'content')
      .where(
        'comment.commentId = :commentId AND comment.status <> :status_comment AND content.status <> :status_content',
        {
          commentId,
          status_comment: STATUS_COMMENT.deleted,
          status_content: STATUS_CONTENT.deleted,
        },
      );
  }

  private mapResponseComment(data: Comment[], userId: string) {
    return data.map(
      (comment) =>
        new ResponseCommentDto({
          ...comment,
          likeCount: comment?.likes?.length ?? 0,
          isLiked:
            comment?.likes?.some((like) => like.userId === userId) ?? false,
          username: comment.user.username,
          imageProfile: comment.user?.profile?.photo.url ?? null,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          replies_comment: comment.replies.map((replies) => {
            return {
              id: replies.commentId,
              text: replies?.text ?? null,
              username: replies.user.username,
              status: replies.status,
              isLiked:
                replies.likes?.some((like) => like.userId === userId) ?? false,
              imageProfile: replies.user?.profile?.photo.url ?? null,
              likeCount: replies?.likes?.length ?? 0,
              repliesCount: replies?.replies?.length ?? 0,
              created_at: replies.createdAt,
              updated_at: replies.updatedAt,
            };
          }),
        }),
    );
  }

  public async getCommentById(commentId: string, userId: string) {
    try {
      const comment = await this.queryCommentById(commentId)
        .leftJoinAndSelect('comment.likes', 'like')
        .leftJoinAndSelect(
          'comment.replies',
          'replies',
          'replies.status <> :status',
          {
            status: STATUS_COMMENT.deleted,
          },
        )
        .leftJoinAndSelect(
          'replies.replies',
          'replies_replies',
          'replies_replies.status <> :status',
          { status: STATUS_COMMENT.deleted },
        )
        .leftJoin('comment.user', 'user')
        .leftJoin('user.profile', 'profile')
        .leftJoin('profile.photo', 'photoProfile')
        .leftJoin('replies.user', 'replies_user')
        .leftJoin('replies_user.profile', 'replies_profile')
        .leftJoin('replies_profile.photo', 'replies_photoProfile')
        .addSelect([
          'user.username',
          'profile.profileId',
          'photoProfile.url',
          'replies_user.username',
          'replies_profile.profileId',
          'replies_photoProfile.url',
        ])
        .getOne();

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      const filter_data = this.mapResponseComment([comment], userId);

      return filter_data;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  public async updateComment({ commentId, userId, text }: IUpdateComment) {
    try {
      await this.entityManager.transaction(async (entityManager) => {
        const findComment = await this.queryComment()
          .leftJoinAndSelect('comment.content', 'content')
          .where(
            'comment.commentId = :commentId AND comment.user = :userId AND comment.status <> :status',
            {
              commentId,
              userId,
              status: STATUS_COMMENT.deleted,
            },
          )
          .useTransaction(true)
          .setLock('pessimistic_write')
          .getOne();

        if (!findComment) {
          throw new NotFoundException('comment not found');
        }

        if (findComment.content.status === STATUS_CONTENT.deleted) {
          throw new NotFoundException(
            'Comment has been deleted and cannot be updated.',
          );
        }

        const expiredAt = new Date().getTime() - THIRTY_MINUTES_IN_MILLISECONDS;
        if (findComment.createdAt < expiredAt) {
          throw new BadRequestException(
            'Cannot update comment within thirty minutes of the last update.',
          );
        }

        await entityManager.update(Comment, { commentId }, { text });
      });
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  public async commentContent(contentId: string, userId: string, text: string) {
    try {
      const user = await this.getUser(userId);
      const content = await this.contentService.getContentById(contentId);
      await this.createContent({ content, user, text });
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
      const comment = await this.queryCommentById(parentComment).getOne();
      if (!comment) {
        throw new NotFoundException('comment not found');
      }
      const content = comment.content;
      await this.createContent({
        text,
        user,
        content,
        parentComment: comment,
      });
    } catch (error) {
      this.logger.error(error.massage);
      throw error;
    }
  }

  public async likeComment(commentId: string, userId: string) {
    try {
      const content = await this.commentRepository
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.content', 'content')
        .where(
          'comment.commentId = :commentId AND comment.status <> :status_comment AND content.status <> :status_content',
          {
            commentId,
            status_comment: STATUS_COMMENT.deleted,
            status_content: STATUS_CONTENT.deleted,
          },
        )
        .getOne();

      if (!content) {
        throw new NotFoundException('Content not found');
      }

      return await this.likeService.likeContent(content, userId);
    } catch (error) {
      throw error;
    }
  }
}
