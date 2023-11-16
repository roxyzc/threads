import { Injectable, Logger } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Content } from 'src/app/entities/content.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from 'src/app/entities/likes.entity';

@Injectable()
export class LikeService {
  private logger = new Logger(LikeService.name);

  constructor(
    @InjectRepository(Like)
    private readonly LikeRepository: Repository<Like>,
    private schedulerRegistry: SchedulerRegistry,
    private readonly entityManager: EntityManager,
  ) {}

  public async likeContent(content: Content, userId: string) {
    const seconds = '30';
    try {
      const checkLikeContent = await this.queryLikeContent()
        .where('l.userId = :userId AND l.contentId = :contentId', {
          userId,
          contentId: content.contentId,
        })
        .getRawOne();

      if (checkLikeContent) {
        const jobName = `delete_like_${content.contentId}_from_${userId}`;
        const existingJob = this.getJob(jobName);
        if (existingJob) {
          await this.deleteCron(jobName);
          return this.responseLikeContent('nggak jadi', false, false);
        } else {
          this.addCronJobOnce(
            jobName,
            seconds,
            this.deleteCb(jobName, seconds, content, userId),
          );
          return this.responseLikeContent('deleted successfully', true, false);
        }
      } else {
        const jobName = `like_${content.contentId}_from_${userId}`;
        const existingJob = this.getJob(jobName);
        if (existingJob) {
          await this.deleteCron(jobName);
          return this.responseLikeContent('nggak jadi', false, false);
        } else {
          this.addCronJobOnce(
            jobName,
            seconds,
            this.addCb(jobName, seconds, content, userId),
          );
          return this.responseLikeContent('add successfully', false, true);
        }
      }
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  private responseLikeContent(
    message: string,
    statusDelete: boolean,
    statusAdd: boolean,
  ) {
    return {
      message,
      delete: statusDelete,
      add: statusAdd,
    };
  }

  private addCb(
    name: string,
    seconds: string,
    content: Content,
    userId: string,
  ) {
    return async () => {
      this.logger.log(`Job ${name} running at ${seconds} seconds!`);
      const likeContent = this.entityManager.create(Like, {
        content,
        userId,
      });
      try {
        await this.entityManager.save(likeContent);
        await this.deleteCron(name);
      } catch (error) {
        this.logger.error(`Error in CronJob: ${error.message}`);
      }
    };
  }

  private deleteCb(
    name: string,
    seconds: string,
    content: Content,
    userId: string,
  ) {
    return async () => {
      this.logger.log(`Job ${name} running at ${seconds} seconds!`);
      try {
        await this.entityManager.delete(Like, {
          userId,
          contentId: content.contentId,
        });

        await this.deleteCron(name);
      } catch (error) {
        this.logger.error(`Error in CronJob: ${error.message}`);
      }
    };
  }

  private async addCronJobOnce(
    name: string,
    seconds: string,
    callback: () => Promise<void>,
  ) {
    const job = new CronJob(`${seconds} * * * * *`, callback);

    this.schedulerRegistry.addCronJob(name, job);
    job.start();

    this.logger.log(`Job ${name} added to run once at ${seconds} seconds!`);
  }

  private queryLikeContent() {
    return this.LikeRepository.createQueryBuilder('l');
  }

  private getJob(name: string) {
    try {
      this.schedulerRegistry.getCronJob(name);
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteCron(name: string) {
    this.schedulerRegistry.deleteCronJob(name);
    this.logger.log(`Job ${name} deleted!`);
  }
}
