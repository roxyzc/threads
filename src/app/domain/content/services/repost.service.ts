import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Repost } from 'src/app/entities/repost.entity';
import { ContentService } from './content.service';

@Injectable()
export class RepostService {
  private readonly logger = new Logger(RepostService.name);

  constructor(
    @InjectRepository(Repost)
    private readonly repostRepository: Repository<Repost>,
    private readonly entityManager: EntityManager,
    private readonly contentService: ContentService,
  ) {}

  private async doesRepostExist(contentId: string): Promise<boolean> {
    const repostExists = await this.repostRepository
      .createQueryBuilder('r')
      .where('r.contentId = :contentId', { contentId })
      .getExists();

    return repostExists;
  }

  public async createRepost(contentId: string, userId: string): Promise<void> {
    try {
      await this.ensureContentExists(contentId);

      const repostExists = await this.doesRepostExist(contentId);
      if (repostExists) {
        throw new BadRequestException('Repost already exists');
      }

      const newRepost = this.entityManager.create(Repost, {
        contentId,
        userId,
      });

      await this.entityManager.save(newRepost);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  public async deleteRepost(contentId: string, userId: string): Promise<void> {
    try {
      await this.ensureContentExists(contentId);

      const repostExists = await this.doesRepostExist(contentId);
      if (!repostExists) {
        throw new NotFoundException('Repost not found');
      }

      await this.entityManager.delete(Repost, { contentId, userId });
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  private async ensureContentExists(contentId: string): Promise<void> {
    const contentExists = await this.contentService.doesContentExist(contentId);
    if (!contentExists) {
      throw new NotFoundException(`Content ${contentId} does not exist`);
    }
  }
}
