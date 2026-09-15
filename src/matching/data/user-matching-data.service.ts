import { Injectable, NotFoundException } from '@nestjs/common';

import {
  UserMatchingData,
  UserMatchingExperience,
} from './user-matching-data.types';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UserMatchingDataService {
  constructor(private readonly prisma: PrismaService) {}

  async getByUserId(userId: string): Promise<UserMatchingData> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,

        categories: {
          select: {
            categoryId: true,
          },
        },

        audiences: {
          select: {
            audienceTypeId: true,
          },
        },

        contributions: {
          select: {
            id: true,
            contributionId: true,

            contribution: {
              select: {
                name: true,
              },
            },
          },
        },

        experiences: {
          select: {
            contributionId: true,
            durationValue: true,
            durationUnit: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User '${userId}' not found`);
    }

    return {
      userId: user.id,

      categoryIds: user.categories.map((item) => item.categoryId),

      audienceTypeIds: user.audiences.map((item) => item.audienceTypeId),

      contributions: user.contributions.map((item) => ({
        id: item.id,
        contributionId: item.contributionId,
        name: item.contribution.name,
      })),

      experiences: user.experiences.map((item): UserMatchingExperience => ({
        contributionId: item.contributionId,
        durationValue: item.durationValue,
        durationUnit: item.durationUnit,
      })),
    };
  }
}
