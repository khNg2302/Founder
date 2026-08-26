import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaTransaction } from 'prisma/prisma.types';
import { UpdateProfileDto } from 'src/auth/dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto, tx: PrismaTransaction = this.prisma) {
    return tx.user.create({
      data,
    });
  }

  async findById(id: string, tx: PrismaTransaction = this.prisma) {
    return tx.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        status: true,
        deletionRequestedAt: true,
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

  async markPendingDeletion(
    userId: string,
    tx: PrismaTransaction = this.prisma,
  ) {
    return tx.user.update({
      where: {
        id: userId,
      },
      data: {
        status: 'PENDING_DELETION',
        deletionRequestedAt: new Date(),
      },
    });
  }

  async reactivate(userId: string, tx: PrismaTransaction = this.prisma) {
    return tx.user.update({
      where: {
        id: userId,
      },
      data: {
        status: 'ACTIVE',
        deletionRequestedAt: null,
      },
    });
  }
}
