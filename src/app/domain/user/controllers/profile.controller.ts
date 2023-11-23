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
import { ResponseProfile } from '../dtos/response-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdatePhotoProfileDto } from '../dtos/update-photo-ptofile.dto';
import { ParseFilePipe } from 'src/app/core/pipe/parseFilePipe.pipe';
import { GetUser } from 'src/app/core/decorators/getUser.decorator';

@Controller('profile')
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);
  constructor(private readonly profileService: ProfileService) {}

  @Roles(UserRoles.USER, UserRoles.ADMIN)
  @Get('get')
  async getProfileUser(
    @GetUser() { userId }: { userId: string },
    @Query('user_id', ParseUUIDPipe) id: string,
  ): Promise<HttpResponse & { data: ResponseProfile }> {
    try {
      const profile = await this.profileService.getProfile(id, userId);
      return {
        message: 'Ok',
        statusCode: HttpStatus.OK,
        data: profile,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
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
  @Patch('update')
  async updateProfile(
    @Query('user_id', ParseUUIDPipe) userId: string,
    @Body() body: UpdateProfileDto,
  ): Promise<HttpResponse> {
    try {
      await this.profileService.updateProfile(userId, body);
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
