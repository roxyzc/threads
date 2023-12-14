import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { FollowshipService } from '../services/followership.service';
import { GetUser } from 'src/app/core/decorators/getUser.decorator';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { UserRoles } from 'src/app/entities/user.entity';
import { HttpResponse } from '../../interfaces/response.interface';
import { FollowUserDto } from '../dtos/follow-user.dto';
import { UnfollowUserDto } from '../dtos/unfollow-user.dto';

@Controller('followship')
export class FollowshipController {
  constructor(private readonly followerService: FollowshipService) {}

  @Post('follow')
  @Roles(UserRoles.USER)
  async followedUser(
    @Body() { username }: FollowUserDto,
    @GetUser() { userId }: { userId: string },
  ): Promise<HttpResponse> {
    await this.followerService.actionFollowUserOrUnfollowUser(
      username,
      userId,
      'follow',
    );
    return {
      message: 'User successfully followed',
      statusCode: HttpStatus.OK,
    };
  }

  @Post('unfollow')
  @Roles(UserRoles.USER)
  async unfollowUser(
    @Body() { username }: UnfollowUserDto,
    @GetUser() { userId }: { userId: string },
  ): Promise<HttpResponse> {
    await this.followerService.actionFollowUserOrUnfollowUser(
      username,
      userId,
      'unfollow',
    );
    return {
      message: 'User successfully unfollowed',
      statusCode: HttpStatus.OK,
    };
  }

  @Get('get/follower')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  async getFollower(@Query('username') username: string) {
    return await this.followerService.actionGetFollowerOrfollowed(
      username,
      'follower',
    );
  }

  @Get('get/followed')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  async getFollowed(@Query('username') username: string) {
    return await this.followerService.actionGetFollowerOrfollowed(
      username,
      'followed',
    );
  }
}
