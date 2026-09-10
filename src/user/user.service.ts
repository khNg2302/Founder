import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';

import { PrismaTransaction } from 'prisma/prisma.types';
import { UpdateProfileDto } from 'src/user/dto/update-profile.dto';
import { CreateUserInput } from './types/create-user.input';
import { UpdateUserInput } from './types/update-user.input';
import { CategoryClient } from 'src/category/category.client';
import { CategoryResponse } from 'src/category/types/category-response';
import { UserContributionItemDto } from './dto/update-user-contributions.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryClient: CategoryClient,
  ) {}

  async create(data: CreateUserInput, tx: PrismaTransaction = this.prisma) {
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
        fullName: true,
        nickname: true,
        ageRange: true,
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
        fullName: true,
        nickname: true,
        ageRange: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateById(
    id: string,
    data: UpdateUserInput,
    tx: PrismaTransaction = this.prisma,
  ) {
    return tx.user.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        fullName: true,
        nickname: true,
        ageRange: true,
        avatarUrl: true,
        status: true,
        deletionRequestedAt: true,
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
        fullName: true,
        nickname: true,
        ageRange: true,
        avatarUrl: true,
        status: true,
        deletionRequestedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async assignRole(
    userId: string,
    roleId: string,
    tx: PrismaTransaction = this.prisma,
  ) {
    return tx.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  async disable(userId: string, tx: PrismaTransaction = this.prisma) {
    return tx.user.update({
      where: {
        id: userId,
      },
      data: {
        status: 'DISABLED',
      },
    });
  }

  async enable(userId: string, tx: PrismaTransaction = this.prisma) {
    return tx.user.update({
      where: {
        id: userId,
      },
      data: {
        status: 'ACTIVE',
      },
    });
  }

  async findAudiences(userId: string) {
    return this.prisma.userAudience.findMany({
      where: {
        userId,
      },
      select: {
        audienceType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        audienceType: {
          name: 'asc',
        },
      },
    });
  }

  async replaceAudiences(userId: string, audienceTypeIds: string[]) {
    const uniqueIds = [...new Set(audienceTypeIds)];

    const audienceTypes = await this.prisma.audienceType.findMany({
      where: {
        id: {
          in: uniqueIds,
        },
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (audienceTypes.length !== uniqueIds.length) {
      throw new BadRequestException(
        'One or more audience types are invalid or inactive',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userAudience.deleteMany({
        where: {
          userId,
        },
      });

      if (uniqueIds.length > 0) {
        await tx.userAudience.createMany({
          data: uniqueIds.map((audienceTypeId) => ({
            userId,
            audienceTypeId,
          })),
        });
      }
    });

    return this.findAudiences(userId);
  }

  async findCategories(userId: string, accessToken: string) {
    const userCategories = await this.prisma.userCategory.findMany({
      where: {
        userId,
      },
      select: {
        categoryId: true,
      },
    });

    const categoryIds = userCategories.map((item) => item.categoryId);

    if (categoryIds.length === 0) {
      return [];
    }

    return this.categoryClient.findByIds(categoryIds, accessToken);
  }

  private validateCategoryHierarchy(categories: CategoryResponse[]) {
    const selectedIds = new Set(categories.map((category) => category.id));

    for (const category of categories) {
      if (!category.parentId) {
        continue;
      }

      if (selectedIds.has(category.parentId)) {
        continue;
      }

      if (category.type === 'NICHE' || category.type === 'INDUSTRY') {
        continue;
      }
    }
  }

  async replaceCategories(
    userId: string,
    categoryIds: string[],
    accessToken: string,
  ) {
    const uniqueIds = [...new Set(categoryIds)];

    const categories = await this.categoryClient.findByIds(
      uniqueIds,
      accessToken,
    );

    this.validateCategoryHierarchy(categories);

    await this.prisma.$transaction(async (tx) => {
      await tx.userCategory.deleteMany({
        where: {
          userId,
        },
      });

      if (uniqueIds.length > 0) {
        await tx.userCategory.createMany({
          data: uniqueIds.map((categoryId) => ({
            userId,
            categoryId,
          })),
        });
      }
    });

    return categories;
  }

  async findContributions(userId: string) {
    return this.prisma.userContribution.findMany({
      where: { userId },
      include: {
        contribution: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async replaceContributions(userId: string, items: UserContributionItemDto[]) {
    const uniqueIds = [...new Set(items.map((item) => item.contributionId))];

    const contributions = await this.prisma.contribution.findMany({
      where: {
        id: {
          in: uniqueIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (contributions.length !== uniqueIds.length) {
      throw new BadRequestException('One or more contributions are invalid');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userContribution.deleteMany({
        where: {
          userId,
        },
      });

      if (items.length > 0) {
        await tx.userContribution.createMany({
          data: items.map((item) => ({
            userId,
            contributionId: item.contributionId,
            description: item.description?.trim() || null,
          })),
        });
      }
    });

    return this.findContributions(userId);
  }
}
