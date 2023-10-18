import { Module } from '@nestjs/common';
import { ContentService } from './services/content.service';
import { ContentController } from './controllers/content.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from 'src/app/entities/content.entity';
import { Image } from 'src/app/entities/image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Image, Content])],
  providers: [ContentService],
  controllers: [ContentController],
})
export class ContentModule {}