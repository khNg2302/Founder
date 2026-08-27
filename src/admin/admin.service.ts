import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

import { PrismaService } from 'prisma/prisma.service';

import { UserService } from 'src/user/user.service';
import { AccountService } from 'src/account/account.service';
import { RoleService } from 'src/role/role.service';

import { RefreshTokenService } from 'src/common/security/token/refresh-token.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly roleService: RoleService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async findAllUsers() {
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

  async findUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
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

  async createUser(dto: CreateUserDto) {
    const existingAccount = await this.accountService.findLocalByEmail(
      dto.email,
    );

    if (existingAccount) {
      throw new ConflictException('Email already exists');
    }

    const role = await this.roleService.findByName(dto.role);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const user = await this.userService.create(
        {
          name: dto.name,
        },
        tx,
      );

      await this.userService.assignRole(user.id, role.id, tx);

      const account = await this.accountService.createLocal(
        {
          userId: user.id,
          email: dto.email,
          passwordHash,
        },
        tx,
      );

      return {
        userId: user.id,
        accountId: account.id,
      };
    });
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userService.updateById(userId, {
      name: dto.name,
      avatarUrl: dto.avatarUrl,
    });
  }

  async disableUser(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await this.userService.findById(userId, tx);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.userService.disable(userId, tx);

      await this.accountService.disableByUser(userId, tx);

      await this.refreshTokenService.revokeAllByUserId(userId, tx);

      return {
        message: 'User disabled successfully',
      };
    });
  }

  async assignRole(userId: string, roleId: string) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.roleService.findById(roleId);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.userService.assignRole(userId, roleId);
  }
}
