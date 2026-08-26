import { Injectable } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';
import { PrismaTransaction } from 'prisma/prisma.types';
import { OpaqueTokenService } from 'src/common/security/token/opaque-token.service';

@Injectable()
export class ReactivationTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opaqueTokenService: OpaqueTokenService,
  ) {}

  async create(userId: string, tx: PrismaTransaction = this.prisma) {
    const secret = this.opaqueTokenService.generateSecret();

    const tokenHash = await this.opaqueTokenService.hash(secret);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const token = await tx.reactivationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      token: `${token.id}.${secret}`,
      expiresAt,
    };
  }

  async findValid(token: string, tx: PrismaTransaction = this.prisma) {
    const [tokenId, secret] = token.split('.');

    if (!tokenId || !secret) {
      return null;
    }

    const storedToken = await tx.reactivationToken.findFirst({
      where: {
        id: tokenId,
        usedAt: null,
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

  markUsed(tokenId: string, tx: PrismaTransaction = this.prisma) {
    return tx.reactivationToken.update({
      where: {
        id: tokenId,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }
}
