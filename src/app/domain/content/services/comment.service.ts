import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/app/entities/comment.entity';
import { Content } from 'src/app/entities/content.entity';
import { User } from 'src/app/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';

interface ICommentContent {
  content: Content;
  text: string;
  user: User;
}

interface IRepliesComment {
  parentComment: string;
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
  ) {}

  public async getCommentById(commentId: string): Promise<Comment> {
    try {
      const comment = await this.commentRepository
        .createQueryBuilder('comment')
        .where('comment.commentId = :commentId', { commentId })
        .getOne();

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      return comment;
    } catch (error) {
      throw error;
    }
  }

  public async commentContent(data: ICommentContent) {
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

  public async repliesComment({ text, user, parentComment }: IRepliesComment) {
    try {
      const findComment = await this.getCommentById(parentComment);
      const comment = this.entityManager.create(Comment, {
        text,
        user,
        parentComment: findComment,
      });

      await this.entityManager.save(comment);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  public async updateComment({ commentId, userId, text }: IUpdateComment) {
    try {
      const findComment = await this.commentRepository
        .createQueryBuilder('comment')
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
}
