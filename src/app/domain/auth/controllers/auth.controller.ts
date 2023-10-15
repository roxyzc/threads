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
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { CacheService } from 'src/app/shared/cache/cache.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<HttpResponse> {
    if (signupDto.password !== signupDto.confirmPassword) {
      throw new UnauthorizedException('Passwords do not match');
    }

    const message = await this.authService.signup(signupDto);

    return {
      statusCode: HttpStatus.OK,
      message,
    };
  }

  @Post('signin')
  async signin(
    @Body() signin: SigninDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HttpResponse & { data: ResponseAuth }> {
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
  }

  @SkipThrottle()
  @Delete('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies['token'];
    if (token) {
      this.authService.logout(token);
      response.clearCookie('token');
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Ok',
    };
  }

  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @Post('resetpassword')
  async resetPassword(
    @Body() { email }: ResetPasswordDto,
  ): Promise<HttpResponse> {
    await this.authService.resetPassword(email);

    return {
      statusCode: HttpStatus.OK,
      message: 'Ok',
    };
  }

  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @Post('resendverification')
  async resendUserVerification(
    @Body() { email }: ResendUserVerificationDto,
  ): Promise<HttpResponse> {
    await this.authService.resendUserVerification(email);
    return {
      statusCode: HttpStatus.OK,
      message: 'Ok',
    };
  }

  @SkipThrottle()
  @Get('/me')
  async me(
    @Req() request: Request,
  ): Promise<HttpResponse & { data: ResponseAuthRaw }> {
    const token = request.cookies['token'];
    const cacheKey = `me:${token}`;

    const cachedData = await this.cacheService.get<ResponseAuthRaw>(cacheKey);
    if (cachedData) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Ok',
        data: cachedData,
      };
    }

    const data = await this.authService.me(token);
    await this.cacheService.set(`me:${token}`, data, 30);
    return {
      statusCode: HttpStatus.OK,
      message: 'Ok',
      data,
    };
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
  }

  @Get('user-agent')
  async getUserAgent(@Req() request: Request) {
    const userAgent = request.headers['user-agent'];
    return userAgent;
  }
}
