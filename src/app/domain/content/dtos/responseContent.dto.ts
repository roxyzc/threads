import { Exclude, Expose } from 'class-transformer';
import { STATUS_CONTENT } from 'src/app/entities/content.entity';
import { ImageContent } from 'src/app/entities/imageContent.entity';
import { Tag } from 'src/app/entities/tag.entity';
import { User } from 'src/app/entities/user.entity';
import { Like } from 'src/app/entities/likes.entity';
import { Comment } from 'src/app/entities/comment.entity';

export class ResponseContent {
  contentId: string;
  content: string;
  createdAt: number;
  updatedAt: number;

  @Exclude()
  images: ImageContent[];

  images_content: string[];

  @Exclude()
  tags: Tag[];

  tags_content: string[];

  @Exclude()
  user: User;

  status: STATUS_CONTENT;
  username: string;
  fullName: string;

  @Exclude()
  likes?: Like[];

  likes_content?: number;

  @Exclude()
  comments: Comment[];

  comment_content?: any[];

  @Expose({ name: 'photoProfile' })
  url?: string;

  constructor(data: Partial<ResponseContent>) {
    Object.assign(this, data);
  }
}
