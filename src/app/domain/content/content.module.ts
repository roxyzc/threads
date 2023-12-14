import { Module } from '@nestjs/common';
import { ContentService } from './services/content.service';
import { ContentController } from './controllers/content.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from 'src/app/entities/content.entity';
import { ImageContent } from 'src/app/entities/imageContent.entity';
import { GdriveModule } from 'src/app/shared/gdrive/gdrive.module';
import { CommentSubsriber, ContentSubscriber } from './content.subscriber';
import { Tag } from 'src/app/entities/tag.entity';
import { TagService } from './services/tag.service';
import { TagController } from './controllers/tags.controller';
import { UserModule } from '../user/user.module';
import { LikeService } from './services/like.service';
import { Like } from 'src/app/entities/likes.entity';
import { Comment } from 'src/app/entities/comment.entity';
import { CommentService } from './services/comment.service';
import { CommentController } from './controllers/comment.controller';
import { Repost } from 'src/app/entities/repost.entity';
import { RepostService } from './services/repost.service';
import { RepostController } from './controllers/repost.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Content,
      ImageContent,
      Tag,
      Like,
      Comment,
      Repost,
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
    RepostService,
    LikeService,
  ],
  controllers: [
    ContentController,
    CommentController,
    TagController,
    RepostController,
  ],
})
export class ContentModule {}
