import {
  Controller,
  Post,
  Body,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { VerifyResetPasswordDto, VerifyUserDto } from '../dtos/verifyUser.dto';
import { HttpResponse } from '../../interfaces/response.interface';
import { VerifyService } from '../services/verify.service';
import { ConfigService } from '@nestjs/config';
import { decrypt } from 'src/app/utils/crypto.util';

@Controller()
export class VerifyController {
  constructor(
    private readonly verifyService: VerifyService,
    private readonly configService: ConfigService,
  ) {}

  @Post('verify/user')
  async verifyUser(@Body() { token }: VerifyUserDto): Promise<HttpResponse> {
    const data = decrypt(token, this.configService.get('chipher.secret'));

    if (!data) {
      throw new BadRequestException('token invalid');
    }

    await this.verifyService.verifyUser(JSON.parse(data));

    return {
      message: 'activated user successfully',
      statusCode: HttpStatus.OK,
    };
  }

  @Post('resetpassword')
  async resetPassword(@Body() { newPassword, token }: VerifyResetPasswordDto) {
    const data = decrypt(token, this.configService.get('chipher.secret'));

    if (!data) {
      throw new BadRequestException('token invalid');
    }

    await this.verifyService.resetPasswordUser(newPassword, JSON.parse(data));

    return {
      message: 'reset password successfully',
      statusCode: HttpStatus.OK,
    };
  }
}
