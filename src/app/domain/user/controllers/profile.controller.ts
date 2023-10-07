import {
  Controller,
  UseInterceptors,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
} from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { UserInterceptor } from 'src/app/core/interceptors/user.interceptor';
import { CreateProfileDto } from '../dtos/create-profile.dto';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { UserRoles } from 'src/app/entities/user.entity';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  @Get(':id')
  async getProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.profileService.getProfile(id);
  }

  @Roles(UserRoles.USER)
  @UseInterceptors(UserInterceptor)
  @Post(':id')
  async createProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateProfileDto,
  ) {
    await this.profileService.createProfile(id, body);
    return;
  }
}
