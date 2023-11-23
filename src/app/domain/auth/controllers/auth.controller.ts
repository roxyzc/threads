import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpStatus,
  Res,
  Req,
  UseGuards,
  Get,
  BadRequestException,
  Delete,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from '../services/auth.service';
import { HttpResponse } from '../../interfaces/response.interface';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { SigninDto } from '../dtos/signin.dto';
import { SignupDto } from '../dtos/signup.dto';
import { ResetPasswordDto } from '../dtos/resetPassword.dto';
import { ResendUserVerificationDto } from '../dtos/verifyUser.dto';
import { ResponseAuth, ResponseAuthRaw } from '../dtos/response.dto';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { UserRoles } from 'src/app/entities/user.entity';
import { GetUser } from 'src/app/core/decorators/getUser.decorator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<HttpResponse> {
    try {
      if (signupDto.password !== signupDto.confirmPassword) {
        throw new UnauthorizedException('Passwords do not match');
      }

      const message = await this.authService.signup(signupDto);

      return {
        statusCode: HttpStatus.OK,
        message,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Post('signin')
  async signin(
    @Body() signin: SigninDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HttpResponse & { data: ResponseAuth }> {
    try {
      const data = await this.authService.signin(signin);
      response.cookie('token', data.token, {
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure:
          this.configService.get('node.env') === 'production' ? true : false,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Ok',
        data,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Delete('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const token = request.cookies['token'];
      if (token) {
        this.authService.logout(token);
        response.clearCookie('token');
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Ok',
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Post('resetpassword')
  async resetPassword(
    @Body() { email }: ResetPasswordDto,
  ): Promise<HttpResponse> {
    try {
      await this.authService.resetPassword(email);

      return {
        statusCode: HttpStatus.OK,
        message: 'Ok',
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Post('resendverification')
  async resendUserVerification(
    @Body() { email }: ResendUserVerificationDto,
  ): Promise<HttpResponse> {
    try {
      await this.authService.resendUserVerification(email);
      return {
        statusCode: HttpStatus.OK,
        message: 'Ok',
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Roles(UserRoles.ADMIN, UserRoles.USER)
  @Get('me')
  async me(
    @GetUser() { userId }: { userId: string },
  ): Promise<HttpResponse & { data: ResponseAuthRaw }> {
    try {
      const data = await this.authService.me(userId);
      return {
        statusCode: HttpStatus.OK,
        message: 'Ok',
        data,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      if (!request?.user) {
        throw new BadRequestException();
      }

      const data = await this.authService.googleLogin(request.user);
      response.cookie('token', data.token, {
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure:
          this.configService.get('node.env') === 'production' ? true : false,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Ok',
        data,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  @Get('user-agent')
  async getUserAgent(@Req() request: Request) {
    const userAgent = request.headers['user-agent'];
    return userAgent;
  }
}
