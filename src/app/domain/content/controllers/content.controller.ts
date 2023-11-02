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
  ParseIntPipe,
  DefaultValuePipe,
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

  @Get('get/by/contentid')
  @SkipThrottle()
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  async getContentByUserId(
    @Query('content_id', ParseUUIDPipe) contentId: string,
  ) {
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

  @Get('get')
  @SkipThrottle()
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  async getContents(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page?: number,
  ) {
    try {
      return await this.contentService.getContent(limit, page);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Get('get/by/userid')
  @SkipThrottle()
  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  async getContentByContentId(
    @Query('user_id', ParseUUIDPipe) userId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page?: number,
  ): Promise<
    HttpResponse & { data: { pagination?: object; contents: Content[] } }
  > {
    try {
      const { pagination, filter_data } =
        await this.contentService.getContentsByUserId(userId, limit, page);
      return {
        message: 'Ok',
        statusCode: HttpStatus.OK,
        data: {
          pagination,
          contents: filter_data,
        },
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
