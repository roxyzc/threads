import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from 'src/app/entities/token.entity';

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
    TypeOrmModule.forFeature([Token]),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
