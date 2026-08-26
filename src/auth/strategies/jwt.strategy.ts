import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    accountId: string;
    sessionId: string;
  }) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: payload.accountId,
        userId: payload.sub,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!account) {
      throw new UnauthorizedException('Account is not active');
    }

    return {
      userId: account.userId,
      accountId: account.id,
      sessionId: payload.sessionId,
    };
  }
}
