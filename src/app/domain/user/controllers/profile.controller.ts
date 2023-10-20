import {
  Controller,
  UseInterceptors,
  Get,
  Query,
  ParseUUIDPipe,
  Post,
  Body,
  Patch,
  HttpStatus,
  UploadedFile,
  Put,
  Logger,
} from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { UserInterceptor } from 'src/app/core/interceptors/user.interceptor';
import { CreateProfileDto } from '../dtos/create-profile.dto';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { UserRoles } from 'src/app/entities/user.entity';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { HttpResponse } from '../../interfaces/response.interface';
import { Throttle } from '@nestjs/throttler';
import { ResponseProfile } from '../dtos/response-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CacheService } from 'src/app/shared/cache/cache.service';
import { UpdatePhotoProfileDto } from '../dtos/update-photo-ptofile.dto';
import { ParseFilePipe } from 'src/app/core/pipe/parseFilePipe.pipe';

@Controller('profile')
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);
  constructor(
    private readonly profileService: ProfileService,
    private readonly cacheService: CacheService,
  ) {}

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  @Throttle({ default: { limit: 10, ttl: 30000 } })
  @Get()
  async getProfile(
    @Query('user_id', ParseUUIDPipe) userId: string,
  ): Promise<HttpResponse & { data: ResponseProfile }> {
    try {
      const cacheKey = `profile=${userId}`;
      const cacheProfile = await this.cacheService.get<ResponseProfile>(
        cacheKey,
      );

      if (cacheProfile) {
        return {
          message: 'cached profile',
          statusCode: HttpStatus.OK,
          data: cacheProfile,
        };
      }

      const profile = await this.profileService.getProfile(userId);
      await this.cacheService.set(`profile=${userId}`, profile, 30);
      return {
        message: 'Ok',
        statusCode: HttpStatus.OK,
        data: profile,
      };
    } catch (err) {
      this.logger.error(err.message);
      throw err;
    }
  }

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  @Post()
  async createProfile(
    @Query('user_id', ParseUUIDPipe) userId: string,
    @Body() body: CreateProfileDto,
  ): Promise<HttpResponse> {
    try {
      await this.profileService.createProfile(userId, body);
      return {
        message: 'created profile successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  @Patch()
  async updateProfile(
    @Query('user_id', ParseUUIDPipe) userId: string,
    @Body() body: UpdateProfileDto,
  ): Promise<HttpResponse> {
    try {
      await this.profileService.updateProfile(userId, body);
      await this.cacheService.del(`profile=${userId}`);
      return {
        message: 'Profile updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor, FileInterceptor('image'))
  @Post('upload')
  async sendPhotoProfile(
    @Query('user_id', ParseUUIDPipe) userId: string,
    @UploadedFile(ParseFilePipe)
    file: Express.Multer.File,
  ): Promise<HttpResponse & { url: string; fileId: string }> {
    try {
      const data = await this.profileService.sendPhotoProfile(file, userId);
      return {
        statusCode: HttpStatus.OK,
        message: 'successfully uploaded',
        ...data,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor, FileInterceptor('image'))
  @Put('upload')
  async updatePhotoProfile(
    @Query('user_id', ParseUUIDPipe) _userId: string,
    @UploadedFile(ParseFilePipe)
    file: Express.Multer.File,
    @Body() { fileId }: UpdatePhotoProfileDto,
  ): Promise<HttpResponse> {
    try {
      await this.profileService.updatePhotoProfile(file, fileId);

      return {
        message: 'Photo profile updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
