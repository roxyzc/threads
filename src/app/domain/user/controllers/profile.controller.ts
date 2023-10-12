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
  Inject,
  Param,
} from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { UserInterceptor } from 'src/app/core/interceptors/user.interceptor';
import { CreateProfileDto } from '../dtos/create-profile.dto';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { UserRoles } from 'src/app/entities/user.entity';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { HttpResponse } from '../../interfaces/response.interface';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { ResponseProfile } from '../dtos/response-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CacheInterceptor, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  @Throttle({ default: { limit: 10, ttl: 30000 } })
  @Get()
  async getProfile(
    @Query('id', ParseUUIDPipe) id: string,
  ): Promise<HttpResponse & { data: ResponseProfile }> {
    const profile = await this.profileService.getProfile(id);
    await this.cacheManager.set(`profile=${id}`, profile);
    return {
      message: 'Ok',
      statusCode: HttpStatus.OK,
      data: profile,
    };
  }

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  @Post()
  async createProfile(
    @Query('id', ParseUUIDPipe) id: string,
    @Body() body: CreateProfileDto,
  ): Promise<HttpResponse> {
    await this.profileService.createProfile(id, body);
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

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
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

  @SkipThrottle()
  @UseInterceptors(CacheInterceptor)
  @Get(':fileId')
  async getImage(@Param('fileId') fileId: string) {
    const data = await this.profileService.getPhotoProfile(fileId);
    await this.cacheManager.set(`image=${fileId}`, data);
    return data;
  }
}

// res.setHeader('Content-Type', 'image/jpeg');
// res.send(imageBuffer);
