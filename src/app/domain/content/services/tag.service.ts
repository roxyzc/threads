import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from 'src/app/entities/tag.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>,
  ) {}

  public async calcTrending(page: number, limit: number) {
    try {
      if (page < 1 || limit < 1) {
        throw new BadRequestException(
          'page and pageSize must be positive integers.',
        );
      }

      const limit_item = limit > 20 ? 20 : limit;
      const start = (page - 1) * limit_item;

      const oneWeekAgo = new Date().setDate(new Date().getDate() - 7);
      const data = await this.tagRepository
        .createQueryBuilder()
        .select('name')
        .addSelect('COUNT(*) as count')
        .groupBy('name')
        .where('createdAt > :oneWeekAgo', { oneWeekAgo })
        .addOrderBy('count', 'DESC')
        .addOrderBy('createdAt', 'ASC')
        .take(limit_item)
        .skip(start)
        .getRawMany();

      return data;
    } catch (error) {
      throw error;
    }
  }
}
