import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async createAccessToken(payload: {
    sub: string;
    accountId: string;
    sessionId: string;
  }) {
    return this.jwtService.signAsync(payload);
  }
}
