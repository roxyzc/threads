import { Exclude, Expose } from 'class-transformer';
import { STATUS_CONTENT } from 'src/app/entities/content.entity';
import { ImageContent } from 'src/app/entities/imageContent.entity';
import { Tag } from 'src/app/entities/tag.entity';
import { User } from 'src/app/entities/user.entity';
import { Like } from 'src/app/entities/likes.entity';
import { Comment } from 'src/app/entities/comment.entity';

type ReplyItem = {
  id: string;
  username: string;
  text: string;
  likeCount: number;
  isLiked: boolean;
  imageProfile: string;
  replies: number;
  created_at: number;
  updated_at: number;
};

type RepliesDataArray = ReplyItem[];

type RepliesDataObject = {
  count: number;
  imagesProfile: string[];
};

type RepliesData = RepliesDataArray | RepliesDataObject;

export class ResponseContent {
  @Expose({ name: 'id' })
  contentId: string;

  @Expose()
  content: {
    text: string;
    images: string[];
    hastags: string[];
  };

  isVerified: boolean;

  @Exclude()
  images: ImageContent[];

  @Exclude()
  tags: Tag[];

  @Exclude()
  user: User;

  status: STATUS_CONTENT;
  username: string;
  fullName: string;

  @Exclude()
  likes?: Like[];

  isLiked?: boolean;

  likeCount?: number;

  replies: RepliesData;

  IsReposted: boolean;

  @Exclude()
  comments: Comment[];

  @Expose({ name: 'imageProfile' })
  url?: string;

  createdAt: number;

  updatedAt: number;

  constructor(data: Partial<ResponseContent>) {
    Object.assign(this, data);
  }
}
