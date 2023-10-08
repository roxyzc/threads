import {
  Controller,
  UseInterceptors,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  Patch,
  HttpStatus,
} from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { UserInterceptor } from 'src/app/core/interceptors/user.interceptor';
import { CreateProfileDto } from '../dtos/create-profile.dto';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { UserRoles } from 'src/app/entities/user.entity';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { HttpResponse } from '../../interfaces/response.interface';
import { Profile } from 'src/app/entities/profile.entity';
import { Throttle } from '@nestjs/throttler';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  @Throttle({ default: { limit: 10, ttl: 30000 } })
  @Get(':id')
  async getProfile(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HttpResponse & { data: Profile }> {
    const profile = await this.profileService.getProfile(id);
    return {
      message: 'Ok',
      statusCode: HttpStatus.OK,
      data: profile,
    };
  }

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  @Post(':id')
  async createProfile(
    @Param('id', ParseUUIDPipe) id: string,
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
  @Patch(':id')
  async updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProfileDto,
  ): Promise<HttpResponse> {
    await this.profileService.updateProfile(id, body);
    return {
      message: 'Profile updated successfully',
      statusCode: HttpStatus.OK,
    };
  }
}
