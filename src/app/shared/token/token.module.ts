import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.getOrThrow('jwt.publicKey'),
        signOptions: {
          expiresIn: '1d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
