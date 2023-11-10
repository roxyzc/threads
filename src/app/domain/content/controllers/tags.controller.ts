import {
  Controller,
  Logger,
  Get,
  HttpStatus,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { TagService } from '../services/tag.service';
import { HttpResponse } from '../../interfaces/response.interface';
import { Tag } from 'src/app/entities/tag.entity';

@Controller('tag')
export class TagController {
  private readonly logger = new Logger(TagController.name);

  constructor(private readonly tagService: TagService) {}

  @Get('trending')
  async getCalculationTags(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe)
    limit?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page?: number,
  ): Promise<HttpResponse & { data: Tag[] }> {
    try {
      const data = await this.tagService.calcTrending(page, limit);
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
}
