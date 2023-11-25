import { Exclude, Expose } from 'class-transformer';
import { STATUS_COMMENT } from 'src/app/entities/comment.entity';
import { Like } from 'src/app/entities/likes.entity';
import { Comment } from 'src/app/entities/comment.entity';
import { User } from 'src/app/entities/user.entity';
import { Content } from 'src/app/entities/content.entity';

type ReplyItem = {
  id: string;
  username: string;
  text: string;
  likeCount: number;
  repliesCount: number;
  isLiked: boolean;
  imageProfile: string;
  created_at: number;
  updated_at: number;
};

type RepliesDataArray = ReplyItem[];

export class ResponseCommentDto {
  @Expose({ name: 'id' })
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

  likeCount: number;

  @Exclude()
  replies?: Comment[];

  replies_comment?: RepliesDataArray;

  isLiked: boolean;

  imageProfile: string;

  constructor(partial: Partial<ResponseCommentDto>) {
    Object.assign(this, partial);
  }
}
