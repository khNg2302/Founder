import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        status: true,
        deletionRequestedAt: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByIdForAdmin(id: string) {
    const user = await this.prisma.user.findUnique({
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
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        },
        accounts: {
          select: {
            id: true,
            provider: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
