import {
  Controller,
  Logger,
  Get,
  HttpStatus,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { TagService } from '../services/tag.service';
import { HttpResponse } from '../../interfaces/response.interface';
import { Tag } from 'src/app/entities/tag.entity';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('tag')
export class TagController {
  private readonly logger = new Logger(TagController.name);

  constructor(private readonly tagService: TagService) {}

  @Get('trending')
  @SkipThrottle()
  async getCalculationTags(
    @Query('limit', ParseIntPipe) limit: number,
    @Query('page', ParseIntPipe) page: number,
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
