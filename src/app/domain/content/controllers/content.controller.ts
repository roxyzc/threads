import {
  Body,
  Controller,
  HttpStatus,
  Logger,
  Post,
  Get,
  Query,
  UploadedFiles,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ContentService } from '../services/content.service';
import { CreateContentDto } from '../dtos/createContent.dto';
import { UserInterceptor } from 'src/app/core/interceptors/user.interceptor';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { UserRoles } from 'src/app/entities/user.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ParseFilesPipe } from 'src/app/core/pipe/parseFilesPipe.pipe';
import { HttpResponse } from '../../interfaces/response.interface';
import { Content } from 'src/app/entities/content.entity';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('content')
export class ContentController {
  private readonly logger = new Logger(ContentController.name);
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @Roles(UserRoles.USER)
  @UseInterceptors(
    UserInterceptor,
    FileFieldsInterceptor([{ name: 'images', maxCount: 4 }]),
  )
  async createContent(
    @Body() body: CreateContentDto,
    @Query('user_id', ParseUUIDPipe) userId: string,
    @UploadedFiles(ParseFilesPipe)
    { images }: { images?: Array<Express.Multer.File> },
  ): Promise<HttpResponse> {
    try {
      await this.contentService.createContent(userId, body, images);
      return {
        message: 'created content successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Get('get')
  @SkipThrottle()
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  async getContentByUserId(
    @Query('content_id', ParseUUIDPipe) contentId: string,
  ): Promise<HttpResponse & { data?: Content }> {
    try {
      const data = await this.contentService.getContentByContentId(contentId);
      return {
        message: 'Ok',
        statusCode: HttpStatus.OK,
        data,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Get('get/by')
  @SkipThrottle()
  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  async getContentByContentId(
    @Query('user_id', ParseUUIDPipe) userId: string,
  ): Promise<
    HttpResponse & {
      data: {
        profile: { fullName: string; image: string };
        contents?: Content[];
      };
    }
  > {
    try {
      const { data, profile } = await this.contentService.getContentByUserId(
        userId,
      );
      return {
        message: 'Ok',
        statusCode: HttpStatus.OK,
        data: {
          profile,
          contents: data ?? [],
        },
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
