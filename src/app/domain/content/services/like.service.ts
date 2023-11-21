import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Content } from 'src/app/entities/content.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from 'src/app/entities/likes.entity';
import { Comment } from 'src/app/entities/comment.entity';

@Injectable()
export class LikeService {
  private logger = new Logger(LikeService.name);

  constructor(
    @InjectRepository(Like)
    private readonly LikeRepository: Repository<Like>,
    private schedulerRegistry: SchedulerRegistry,
    private readonly entityManager: EntityManager,
  ) {}

  public async likeContent<T extends Comment | Content>(
    content: T,
    userId: string,
  ) {
    const seconds = '30';
    let jobName: string;
    let checkLikeContent: T;
    try {
      if (content instanceof Content) {
        checkLikeContent = await this.queryLikeContent()
          .where('l.userId = :userId AND l.contentId = :contentId', {
            userId,
            contentId: content.contentId,
          })
          .getRawOne();
        const action = checkLikeContent ? 'delete' : 'like';
        jobName = `${action}_${content.contentId}_from_${userId}`;
      } else if (content instanceof Comment) {
        checkLikeContent = await this.queryLikeContent()
          .where('l.userId = :userId AND l.commentId = :commentId', {
            userId,
            commentId: content.commentId,
          })
          .getRawOne();
        const action = checkLikeContent ? 'delete' : 'like';
        jobName = `${action}_${content.commentId}_from_${userId}`;
      } else {
        throw new BadRequestException('Type not supported');
      }

      const existingJob = this.getJob(jobName);

      if (existingJob) {
        await this.deleteCron(jobName);
        return this.responseLikeContent('nggak jadi', false, false);
      } else {
        const callback = checkLikeContent
          ? this.deleteCb(jobName, seconds, content, userId)
          : this.addCb(jobName, seconds, content, userId);

        this.addCronJobOnce(jobName, seconds, callback);

        const successMessage = checkLikeContent
          ? 'deleted successfully'
          : 'add successfully';
        return this.responseLikeContent(
          successMessage,
          !checkLikeContent,
          !!checkLikeContent,
        );
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

  private addCb<T extends Comment | Content>(
    name: string,
    seconds: string,
    content: T,
    userId: string,
  ) {
    let like: any;
    return async () => {
      this.logger.log(`Job ${name} running at ${seconds} seconds!`);

      try {
        if (content instanceof Content) {
          like = this.entityManager.create(Like, {
            content,
            userId,
          });
        } else if (content instanceof Comment) {
          like = this.entityManager.create(Like, {
            comment: content,
            userId,
          });
        } else {
          throw new BadRequestException('Type not supported');
        }

        await this.entityManager.save(like);
        await this.deleteCron(name);
      } catch (error) {
        this.logger.error(`Error in CronJob: ${error.message}`);
      }
    };
  }

  private deleteCb<T extends Comment | Content>(
    name: string,
    seconds: string,
    content: T,
    userId: string,
  ) {
    return async () => {
      this.logger.log(`Job ${name} running at ${seconds} seconds!`);
      try {
        if (content instanceof Content) {
          await this.entityManager.delete(Like, {
            userId,
            contentId: content.contentId,
          });
        } else if (content instanceof Comment) {
          await this.entityManager.delete(Like, {
            userId,
            commentId: content.commentId,
          });
        } else {
          throw new BadRequestException('Type not supported');
        }

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

  private async deleteCron(name: string) {
    this.schedulerRegistry.deleteCronJob(name);
    this.logger.log(`Job ${name} deleted!`);
  }
}
