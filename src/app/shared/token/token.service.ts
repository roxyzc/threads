import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from '../interfaces/token.interface';
import { Token } from 'src/app/entities/token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly profileRepository: Repository<Token>,
    private readonly jwtService: JwtService,
  ) {}

  async generateToken(payload: Required<TokenPayload>) {
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const findToken = await this.profileRepository
        .createQueryBuilder('token')
        .select('token.accessToken')
        .where('accessToken = :token', { token })
        .getRawOne();

      if (!findToken) {
        throw new UnauthorizedException('Token invalid');
      }

      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw error;
    }
  }
}
