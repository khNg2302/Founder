import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

import { PrismaService } from 'prisma/prisma.service';
import { PrismaTransaction } from 'prisma/prisma.types';

@Injectable()
export class PasswordResetTokenService {
  private readonly expiresInMs = 15 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async create(accountId: string, tx: PrismaTransaction = this.prisma) {
    const token = randomBytes(64).toString('hex');

    const tokenHash = await argon2.hash(token);

    const expiresAt = new Date(Date.now() + this.expiresInMs);

    await tx.passwordResetToken.create({
      data: {
        accountId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      token,
      expiresAt,
    };
  }

  async findValid(token: string, tx: PrismaTransaction = this.prisma) {
    const tokens = await tx.passwordResetToken.findMany({
      where: {
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        account: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    for (const item of tokens) {
      const valid = await argon2.verify(item.tokenHash, token);

      if (valid) {
        return item;
      }
    }

    return null;
  }

  async markUsed(id: string, tx: PrismaTransaction = this.prisma) {
    return tx.passwordResetToken.update({
      where: {
        id,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }
}
