import { Exclude } from 'class-transformer';
import { STATUS_COMMENT } from 'src/app/entities/comment.entity';
import { Like } from 'src/app/entities/likes.entity';
import { Comment } from 'src/app/entities/comment.entity';
import { User } from 'src/app/entities/user.entity';
import { Content } from 'src/app/entities/content.entity';

export class ResponseCommentDto {
  commentId: string;
  text: string;

  @Exclude()
  user: User;

  username: string;

  @Exclude()
  content: Content;

  @Exclude()
  status: STATUS_COMMENT;

  createdAt: number;
  updatedAt: number;

  @Exclude()
  likes?: Like[];

  likes_comment?: number;

  @Exclude()
  replies?: Comment[];

  replies_comment?: any[];

  constructor(partial: Partial<ResponseCommentDto>) {
    Object.assign(this, partial);
  }
}
