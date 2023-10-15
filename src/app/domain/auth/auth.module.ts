import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { TokenModule } from 'src/app/shared/token/token.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/app/entities/user.entity';
import { Profile } from 'src/app/entities/profile.entity';
import { Token } from 'src/app/entities/token.entity';
import { MailModule } from 'src/app/shared/mail/mail.module';
import { VerifyController } from './controllers/verify.controller';
import { VerifyService } from './services/verify.service';
import { GoogleStrategy } from './strategy/google.strategy';
import { UserModule } from '../user/user.module';
import { CacheModule } from 'src/app/shared/cache/cache.module';

@Module({
  imports: [
    TokenModule,
    UserModule,
    TypeOrmModule.forFeature([User, Profile, Token]),
    MailModule,
    CacheModule,
  ],
  providers: [AuthService, VerifyService, GoogleStrategy],
  controllers: [AuthController, VerifyController],
  exports: [AuthService],
})
export class AuthModule {}
