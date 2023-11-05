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
  Patch,
  Delete,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
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
import { UpdateContentDto } from '../dtos/updateContent.dto';

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

  @Get('get_by/contentid')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  async getContentByUserId(
    @Req() request: Request,
    @Query('content_id', ParseUUIDPipe) contentId: string,
  ) {
    try {
      const { userId } = request.user as { userId: string };
      const data = await this.contentService.getContentByContentId(
        contentId,
        userId,
      );
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

  @Get('get_by/userid')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
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

  @Get('get/me')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  async getMe(
    @Req() request: Request,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page?: number,
  ) {
    try {
      const { userId } = request.user as { userId: string };
      const { pagination, filter_data } =
        await this.contentService.getContentMe(userId, limit, page);

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

  @Patch('update')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  @UseInterceptors(UserInterceptor)
  async updateContent(
    @Query('user_id', ParseUUIDPipe) userId: string,
    @Body() payload: UpdateContentDto,
  ): Promise<HttpResponse> {
    await this.contentService.updateContent(userId, payload);
    return {
      message: 'Updated content successfully',
      statusCode: HttpStatus.OK,
    };
  }

  @Delete('delete')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  @UseInterceptors(UserInterceptor)
  async deleteContent(
    @Query('user_id', ParseUUIDPipe) userId: string,
    @Query('content_id', ParseUUIDPipe) contentId: string,
  ): Promise<HttpResponse> {
    await this.contentService.deleteContent(userId, contentId);
    return {
      message: 'Deleted content successfully',
      statusCode: HttpStatus.OK,
    };
  }
}
