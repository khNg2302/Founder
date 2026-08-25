import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, accountId: string) {
    const token = randomBytes(64).toString('hex');

    const tokenHash = await argon2.hash(token);

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

    return {
      token,
      refreshTokenId: refreshToken.id,
      expiresAt,
    };
  }

  async findValid(token: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    for (const storedToken of tokens) {
      const valid = await argon2.verify(storedToken.tokenHash, token);

      if (valid) {
        return storedToken;
      }
    }

    return null;
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
      return;
    }

    await this.revoke(storedToken.id);
  }
}
