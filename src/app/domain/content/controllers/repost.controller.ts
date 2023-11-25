import {
  Controller,
  Post,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { UserRoles } from 'src/app/entities/user.entity';
import { GetUser } from 'src/app/core/decorators/getUser.decorator';
import { HttpResponse } from '../../interfaces/response.interface';
import { UserInterceptor } from 'src/app/core/interceptors/user.interceptor';
import { RepostService } from '../services/repost.service';

@Controller('repost')
export class RepostController {
  constructor(private readonly repostService: RepostService) {}

  @Post('content')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  async createRepost(
    @Query('content_id', ParseUUIDPipe) contentId: string,
    @GetUser() { userId }: { userId: string },
  ): Promise<HttpResponse> {
    await this.repostService.createRepost(contentId, userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }

  @Delete('content')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  @UseInterceptors(UserInterceptor)
  async deleteRepost(
    @Query('content_id', ParseUUIDPipe) contentId: string,
    @Query('user_id', ParseUUIDPipe) userId: string,
  ): Promise<HttpResponse> {
    await this.repostService.deleteRepost(contentId, userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }
}
