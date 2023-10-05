import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from '../../interfaces/token.interface';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async generateToken(payload: Required<TokenPayload>) {
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    const payload = this.jwtService.verify(token);
    return payload;
  }
}
