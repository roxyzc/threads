import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  private transporter() {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      auth: {
        user: this.configService.getOrThrow('smtp.user'),
        pass: this.configService.getOrThrow('smtp.pass'),
      },
    });
  }

  async sendVerifyUser(email: string, token: string): Promise<void> {
    try {
      this.transporter().sendMail({
        from: this.configService.getOrThrow('smtp.user'),
        to: email,
        subject: 'Verify User',
        html: `${this.configService.get(
          'frontendUrl',
        )}/verify/user?token=${token}`,
      });
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }

  async sendResetPassword(email: string, token: string): Promise<void> {
    try {
      this.transporter().sendMail({
        from: this.configService.getOrThrow('smtp.user'),
        to: email,
        subject: 'Reset Password',
        html: `${this.configService.get(
          'frontendUrl',
        )}/resetpassword?token=${token}`,
      });
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }
}
