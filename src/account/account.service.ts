import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PrismaTransaction } from 'prisma/prisma.types';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async findLocalByEmail(email: string) {
    return this.prisma.account.findFirst({
      where: {
        email,
        provider: 'LOCAL',
      },
    });
  }

  async createLocal(
    data: {
      userId: string;
      email: string;
      passwordHash: string;
    },
    tx: PrismaTransaction = this.prisma,
  ) {
    return tx.account.create({
      data: {
        userId: data.userId,
        provider: 'LOCAL',
        email: data.email,
        passwordHash: data.passwordHash,
      },
    });
  }

  async disable(id: string) {
    return this.prisma.account.update({
      where: {
        id,
      },
      data: {
        status: 'DISABLED',
      },
    });
  }

  async scheduleDeletion(id: string) {
    return this.prisma.account.update({
      where: {
        id,
      },
      data: {
        status: 'DISABLED',
        deletedAt: new Date(),
      },
    });
  }
}
