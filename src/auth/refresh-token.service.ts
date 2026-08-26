import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';
import { PrismaTransaction } from 'prisma/prisma.types';
import { OpaqueTokenService } from 'src/common/security/token/opaque-token.service';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opaqueTokenService: OpaqueTokenService,
  ) {}

  async create(userId: string, accountId: string) {
    const secret = this.opaqueTokenService.generateSecret();

    const tokenHash = await this.opaqueTokenService.hash(secret);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        userId,
        accountId,
        tokenHash,
        expiresAt,
      },
    });

    const token = `${refreshToken.id}.${secret}`;

    return {
      token,
      refreshTokenId: refreshToken.id,
      expiresAt,
    };
  }

  async findValid(token: string) {
    const [tokenId, secret] = token.split('.');

    if (!tokenId || !secret) {
      return null;
    }

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        id: tokenId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!storedToken) {
      return null;
    }

    const parsed = this.opaqueTokenService.parse(token);

    if (!parsed) {
      return null;
    }

    const valid = await this.opaqueTokenService.verify(
      storedToken.tokenHash,
      parsed.secret,
    );

    if (!valid) {
      return null;
    }

    return storedToken;
  }

  async revoke(id: string) {
    return this.prisma.refreshToken.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeByToken(token: string) {
    const storedToken = await this.findValid(token);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    await this.revoke(storedToken.id);
  }

  async revokeAllByAccountId(accountId: string) {
    return this.prisma.refreshToken.updateMany({
      where: {
        accountId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async findActiveByAccountId(accountId: string) {
    return this.prisma.refreshToken.findMany({
      where: {
        accountId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async revokeByIdForAccount(id: string, accountId: string) {
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        id,
        accountId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return result.count > 0;
  }

  async revokeAllByUserId(userId: string, tx: PrismaTransaction = this.prisma) {
    return tx.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
