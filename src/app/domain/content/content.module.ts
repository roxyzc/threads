import { Module } from '@nestjs/common';
import { ContentService } from './services/content.service';
import { ContentController } from './controllers/content.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from 'src/app/entities/content.entity';
import { ImageContent } from 'src/app/entities/imageContent.entity';
import { GdriveModule } from 'src/app/shared/gdrive/gdrive.module';
import { User } from 'src/app/entities/user.entity';
import { CommentSubsriber, ContentSubscriber } from './content.subscriber';
import { Tag } from 'src/app/entities/tag.entity';
import { TagService } from './services/tag.service';
import { TagController } from './controllers/tags.controller';
import { Profile } from 'src/app/entities/profile.entity';
import { ImageProfile } from 'src/app/entities/imageProfile.entity';
import { UserModule } from '../user/user.module';
import { LikeService } from './services/like.service';
import { Like } from 'src/app/entities/likes.entity';
import { Comment } from 'src/app/entities/comment.entity';
import { CommentService } from './services/comment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Content,
      ImageContent,
      User,
      Tag,
      Profile,
      ImageProfile,
      Like,
      Comment,
    ]),
    GdriveModule,
    UserModule,
  ],
  providers: [
    ContentService,
    ContentSubscriber,
    TagService,
    CommentService,
    CommentSubsriber,
    LikeService,
  ],
  controllers: [ContentController, TagController],
})
export class ContentModule {}
