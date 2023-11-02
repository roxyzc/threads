import { Exclude, Expose } from 'class-transformer';
import { ImageContent } from 'src/app/entities/imageContent.entity';
import { Tag } from 'src/app/entities/tag.entity';
import { User } from 'src/app/entities/user.entity';

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

  username: string;
  fullName: string;

  @Expose({ name: 'photoProfile' })
  url: string;

  constructor(data: Partial<ResponseContent>) {
    Object.assign(this, data);
  }
}
