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

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly cacheService: CacheService,
  ) {}

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  @Throttle({ default: { limit: 10, ttl: 30000 } })
  @Get()
  async getProfile(
    @Query('id', ParseUUIDPipe) userId: string,
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
      console.error(err.message);
      throw err;
    }
  }

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  @Post()
  async createProfile(
    @Query('id', ParseUUIDPipe) userId: string,
    @Body() body: CreateProfileDto,
  ): Promise<HttpResponse> {
    await this.profileService.createProfile(userId, body);
    return {
      message: 'created profile successfully',
      statusCode: HttpStatus.CREATED,
    };
  }

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  @Patch()
  async updateProfile(
    @Query('id', ParseUUIDPipe) userId: string,
    @Body() body: UpdateProfileDto,
  ): Promise<HttpResponse> {
    await this.profileService.updateProfile(userId, body);
    return {
      message: 'Profile updated successfully',
      statusCode: HttpStatus.OK,
    };
  }

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor, FileInterceptor('file'))
  @Post('upload')
  async sendProfile(
    @Query('id', ParseUUIDPipe) userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<HttpResponse & { url: string; fileId: string }> {
    const data = await this.profileService.sendPhotoProfile(file, userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'successfully uploaded',
      ...data,
    };
  }
}

// res.setHeader('Content-Type', 'image/jpeg');
// res.send(imageBuffer);
