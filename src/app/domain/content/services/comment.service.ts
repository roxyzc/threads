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
import { ResponseCommentDto } from '../dtos/comment.dto';

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
      .where('comment.commentId = :commentId', { commentId })
      .leftJoinAndSelect('comment.content', 'c');
  }

  private mapResponseComment(data: Comment[]) {
    return data.map(
      (comment) =>
        new ResponseCommentDto({
          ...comment,
          likes_comment: comment.likes.length ?? 0,
          username: comment.user.username,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          replies_comment: comment.replies.map((replies) => {
            return {
              commentId: replies.commentId,
              username: replies.user.username,
              text: replies.text,
              likes_comment: replies?.likes?.length ?? 0,
              replies_comment: replies?.replies?.length ?? 0,
              created_at: replies.createdAt,
              updated_at: replies.updatedAt,
            };
          }),
        }),
    );
  }

  public async getCommentById(commentId: string) {
    // const limit = 5;
    try {
      const comment = await this.queryCommentById(commentId)
        .leftJoinAndSelect('comment.likes', 'like')
        .leftJoinAndSelect('comment.replies', 'replies')
        .leftJoinAndSelect('replies.replies', 'replies_replies')
        .leftJoin('comment.user', 'user')
        .leftJoin('replies.user', 'replies_user')
        .addSelect(['user.username', 'replies_user.username'])
        .getOne();

      // const rawResult = await this.commentRepository
      //   .createQueryBuilder('comment')
      //   .where('comment.commentId = :commentId', { commentId })
      //   .leftJoinAndSelect('comment.likes', 'like')
      //   .leftJoinAndSelect(
      //     (qb) => {
      //       return qb.select('u.username, u.userId').from('user', 'u');
      //     },
      //     'u',
      //     'u.userId = comment.user',
      //   )
      //   .leftJoinAndSelect(
      //     (qb) => {
      //       return qb
      //         .select('replies.*')
      //         .from('comment', 'replies')
      //         .orderBy('replies.updatedAt', 'DESC')
      //         .limit(limit + 1);
      //     },
      //     'replies',
      //     'replies.parentCommentCommentId = comment.commentId',
      //   )
      //   .leftJoinAndSelect(
      //     (qb) => {
      //       return qb
      //         .select(
      //           'replies_user.username as replies_user_username, replies_user.userId as replies_user_userId',
      //         )
      //         .from('user', 'replies_user');
      //     },
      //     'replies_user',
      //     'replies_user.replies_user_userId = replies.userUserId',
      //   )
      //   .leftJoinAndSelect(
      //     (qb) => {
      //       return qb
      //         .select(
      //           'replies_like.likeId as replies_like_likeId, replies_like.userId as replies_like_userId, replies_like.commentId as replies_like_commentId',
      //         )
      //         .from('like', 'replies_like');
      //     },
      //     'replies_like',
      //     'replies_like.replies_like_commentId = replies.commentId',
      //   )
      //   .leftJoinAndSelect(
      //     (qb) => {
      //       return qb
      //         .select(
      //           'replies_replies.parentCommentCommentId as replies_replies_commentId, COUNT(replies_replies.parentCommentCommentId) as count_replies',
      //         )
      //         .groupBy('replies_replies.parentCommentCommentId')
      //         .from('comment', 'replies_replies');
      //     },
      //     'replies_replies',
      //     'replies_replies.replies_replies_commentId = replies.commentId',
      //   )
      //   .getRawMany();

      // const data = {
      //   commentId: rawResult[0].comment_commentId,
      //   text: rawResult[0].comment_text,
      //   status: rawResult[0].comment_status,
      //   createdAt: rawResult[0].comment_createdAt,
      //   updatedAt: rawResult[0].comment_updatedAt,
      //   username: rawResult[0].username,
      // };

      // const result = rawResult.map((raw) => {
      //   return {
      //     commentId: raw.commentId,
      //     text: raw.text,
      //     status: raw.status,
      //     createdAt: raw.createdAt,
      //     updatedAt: raw.updatedAt,
      //     username: raw.replies_user_username,
      //     replies: raw.count_replies ?? 0,
      //   };
      // });

      // Object.assign(data, { replies: result });
      // console.log(data);

      const filter_data = this.mapResponseComment([comment]);

      return filter_data;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  public async updateComment({ commentId, userId, text }: IUpdateComment) {
    try {
      const findComment = await this.queryComment()
        .where('comment.commentId = :commentId AND comment.user = :userId', {
          commentId,
          userId,
        })
        .getOne();

      if (!findComment) {
        throw new NotFoundException('comment not found');
      }

      if (
        findComment.updatedAt >
        new Date().getTime() - THIRTY_MINUTES_IN_MILLISECONDS
      ) {
        throw new BadRequestException();
      }

      await this.entityManager.update(Comment, { commentId }, { text });
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  public async commentContent(contentId: string, userId: string, text: string) {
    try {
      const user = await this.getUser(userId);
      const content = await this.contentService.getContentById(contentId);
      if (content.status === STATUS_CONTENT.deleted) {
        throw new BadRequestException();
      }

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
      if (
        content.status === STATUS_CONTENT.deleted ||
        comment.status === STATUS_COMMENT.deleted
      ) {
        throw new BadRequestException();
      }

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
}
