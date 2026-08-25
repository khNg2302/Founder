import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaTransaction } from 'prisma/prisma.types';
import { UpdateProfileDto } from 'src/auth/dto/update-profile.dto';
import { AccountService } from 'src/account/account.service';
import { RefreshTokenService } from 'src/auth/refresh-token.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async create(data: CreateUserDto, tx: PrismaTransaction = this.prisma) {
    return tx.user.create({
      data,
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateProfile(id: string, data: UpdateProfileDto) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async requestAccountDeletion(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    await this.accountService.scheduleDeletion(account.id);

    await this.refreshTokenService.revokeAllByAccountId(account.id);

    return {
      message: 'Account scheduled for deletion',
    };
  }
}
