import {
  Controller,
  Post,
  Query,
  Body,
  Get,
  ParseUUIDPipe,
  HttpStatus,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { CommentService } from '../services/comment.service';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { UserRoles } from 'src/app/entities/user.entity';
import { GetUser } from 'src/app/core/decorators/getUser.decorator';
import { HttpResponse } from '../../interfaces/response.interface';
import { CommentDto } from '../dtos/comment.dto';
import { UserInterceptor } from 'src/app/core/interceptors/user.interceptor';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  async getComment(
    @Query('comment_id', ParseUUIDPipe) commentId: string,
    @GetUser() { userId }: { userId: string },
  ): Promise<HttpResponse & { data: any }> {
    const data = await this.commentService.getCommentById(commentId, userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: data,
    };
  }

  @Post('content')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  async commentContent(
    @Query('content_id', ParseUUIDPipe) contentId: string,
    @GetUser() { userId }: { userId: string },
    @Body() { text }: CommentDto,
  ): Promise<HttpResponse> {
    await this.commentService.commentContent(contentId, userId, text);
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }

  @Post('replies')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  async repliesComment(
    @Query('comment_id', ParseUUIDPipe) commentId: string,
    @GetUser() { userId }: { userId: string },
    @Body() { text }: CommentDto,
  ): Promise<HttpResponse> {
    await this.commentService.repliesComment(commentId, userId, text);
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }

  @Patch('update')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  @UseInterceptors(UserInterceptor)
  async updateComment(
    @Query('comment_id', ParseUUIDPipe) commentId: string,
    @Query('user_id', ParseUUIDPipe) userId: string,
    @Body() { text }: CommentDto,
  ) {
    await this.commentService.updateComment({ commentId, userId, text });
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }

  @Post('like')
  @Roles(UserRoles.USER, UserRoles.ADMIN)
  @UseInterceptors(UserInterceptor)
  async likeContent(
    @Query('comment_id', ParseUUIDPipe) commentId: string,
    @Query('user_id', ParseUUIDPipe) userId: string,
  ): Promise<HttpResponse & { add: boolean; delete: boolean }> {
    const data = await this.commentService.likeComment(commentId, userId);
    return {
      ...data,
      statusCode: HttpStatus.OK,
    };
  }
}
