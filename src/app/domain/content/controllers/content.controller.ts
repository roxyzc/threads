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
} from '@nestjs/common';
import { ContentService } from '../services/content.service';
import { CreateContentDto } from '../dtos/createContent.dto';
import { UserInterceptor } from 'src/app/core/interceptors/user.interceptor';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { UserRoles } from 'src/app/entities/user.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ParseFilesPipe } from 'src/app/core/pipe/parseFilesPipe.pipe';
import { HttpResponse } from '../../interfaces/response.interface';

@Controller('content')
export class ContentController {
  private readonly logger = new Logger(ContentController.name);
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @Roles(UserRoles.USER)
  @UseInterceptors(
    UserInterceptor,
    FileFieldsInterceptor([{ name: 'images', maxCount: 3 }]),
  )
  async createContent(
    @Body() body: CreateContentDto,
    @Query('id') userId: string,
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
  async getContentByUserId(@Query('content_id') contentId: string) {
    try {
      return await this.contentService.getContentByContentId(contentId);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Get('get/byuserid')
  async getContentByContentId(@Query('id') userId: string) {
    try {
      const data = await this.contentService.getContentByUserId(userId);
      return {
        data: data,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
