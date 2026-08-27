import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from 'prisma/prisma.service';
import { PrismaTransaction } from 'prisma/prisma.types';
import { RefreshTokenService } from 'src/common/security/token/refresh-token.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

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

  async findByIdForUser(accountId: string, userId: string) {
    return this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
      select: {
        id: true,
        provider: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(
    accountId: string,
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
        provider: 'LOCAL',
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (!account || !account.passwordHash) {
      throw new UnauthorizedException('Invalid account');
    }

    const valid = await argon2.verify(account.passwordHash, currentPassword);

    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        passwordHash,
      },
    });

    await this.refreshTokenService.revokeAllByAccountId(account.id);
  }

  async changeEmail(
    accountId: string,
    userId: string,
    newEmail: string,
    currentPassword: string,
  ) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
        provider: 'LOCAL',
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (!account || !account.passwordHash) {
      throw new UnauthorizedException('Invalid account');
    }

    const valid = await argon2.verify(account.passwordHash, currentPassword);

    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const email = newEmail.trim().toLowerCase();

    const existingAccount = await this.prisma.account.findFirst({
      where: {
        email,
        id: {
          not: account.id,
        },
      },
    });

    if (existingAccount) {
      throw new ConflictException('Email already exists');
    }

    await this.prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        email,
      },
    });

    await this.refreshTokenService.revokeAllByAccountId(account.id);

    return {
      message: 'Email changed successfully',
    };
  }

  async findByProviderAccountId(
    provider: 'GOOGLE' | 'GITHUB',
    providerAccountId: string,
  ) {
    return this.prisma.account.findFirst({
      where: {
        provider,
        providerAccountId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  }

  async findAllByEmail(email: string) {
    return this.prisma.account.findMany({
      where: {
        email,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  }

  async createOAuth(
    data: {
      userId: string;
      provider: 'GOOGLE' | 'GITHUB';
      providerAccountId: string;
      email: string;
    },
    tx: PrismaTransaction = this.prisma,
  ) {
    return tx.account.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        email: data.email,
        passwordHash: null,
      },
    });
  }

  async disableAllByUserId(
    userId: string,
    tx: PrismaTransaction = this.prisma,
  ) {
    return tx.account.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      data: {
        status: 'DISABLED',
        deletedAt: new Date(),
      },
    });
  }

  async enableAllByUserId(userId: string, tx: PrismaTransaction = this.prisma) {
    return tx.account.updateMany({
      where: {
        userId,
        status: 'DISABLED',
      },
      data: {
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  }

  async disableByUser(userId: string, tx: PrismaTransaction = this.prisma) {
    return tx.account.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'DISABLED',
      },
    });
  }
}
