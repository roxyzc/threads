import { Injectable, Logger } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Content } from 'src/app/entities/content.entity';
import { LikeContent } from 'src/app/entities/likeContent.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LikeContentService {
  private logger = new Logger(LikeContentService.name);

  constructor(
    @InjectRepository(LikeContent)
    private readonly likeContentRepository: Repository<LikeContent>,
    private schedulerRegistry: SchedulerRegistry,
    private readonly entityManager: EntityManager,
  ) {}

  public async likeContent(content: Content, userId: string) {
    const seconds = '59';
    try {
      const checkLikeContent = await this.queryLikeContent()
        .where('l.userId = :userId', { userId })
        .getRawOne();

      if (checkLikeContent) {
        const jobName = `delete_like_${content.contentId}_to_${userId}`;
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
        const jobName = `like_${content.contentId}_to_${userId}`;
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
      const likeContent = this.entityManager.create(LikeContent, {
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
        await this.entityManager.delete(LikeContent, {
          userId,
          content: content.contentId,
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
    return this.likeContentRepository.createQueryBuilder('l');
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
