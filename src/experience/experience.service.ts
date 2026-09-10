import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';

import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

@Injectable()
export class ExperienceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    return this.prisma.experience.findMany({
      where: {
        userId,
      },
      include: {
        userContribution: {
          include: {
            contribution: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(userId: string, id: string) {
    const experience = await this.prisma.experience.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        userContribution: {
          include: {
            contribution: true,
          },
        },
      },
    });

    if (!experience) {
      throw new NotFoundException(`Experience '${id}' not found`);
    }

    return experience;
  }

  async create(userId: string, dto: CreateExperienceDto) {
    const contributionId = dto.contributionId.trim();

    if (!contributionId) {
      throw new BadRequestException('Contribution ID must not be blank');
    }

    const title = dto.title.trim();

    if (!title) {
      throw new BadRequestException('Experience title must not be blank');
    }

    await this.validateUserContribution(userId, contributionId);

    this.validateDuration(dto.durationValue, dto.durationUnit);

    return this.prisma.experience.create({
      data: {
        userId,
        contributionId,
        title,
        description: dto.description?.trim() || null,
        durationValue: dto.durationValue ?? null,
        durationUnit: dto.durationUnit ?? null,
      },
      include: {
        userContribution: {
          include: {
            contribution: true,
          },
        },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateExperienceDto) {
    const existing = await this.findById(userId, id);

    const data: {
      contributionId?: string;
      title?: string;
      description?: string | null;
      durationValue?: number | null;
      durationUnit?: 'MONTH' | 'YEAR' | null;
    } = {};

    if (dto.contributionId !== undefined) {
      const contributionId = dto.contributionId.trim();

      if (!contributionId) {
        throw new BadRequestException('Contribution ID must not be blank');
      }

      await this.validateUserContribution(userId, contributionId);

      data.contributionId = contributionId;
    }

    if (dto.title !== undefined) {
      const title = dto.title.trim();

      if (!title) {
        throw new BadRequestException('Experience title must not be blank');
      }

      data.title = title;
    }

    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }

    if (dto.durationValue !== undefined) {
      data.durationValue = dto.durationValue;
    }

    if (dto.durationUnit !== undefined) {
      data.durationUnit = dto.durationUnit;
    }

    const durationValue =
      dto.durationValue !== undefined
        ? dto.durationValue
        : existing.durationValue;

    const durationUnit =
      dto.durationUnit !== undefined ? dto.durationUnit : existing.durationUnit;

    this.validateDuration(durationValue, durationUnit);

    return this.prisma.experience.update({
      where: {
        id,
      },
      data,
      include: {
        userContribution: {
          include: {
            contribution: true,
          },
        },
      },
    });
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);

    await this.prisma.experience.delete({
      where: {
        id,
      },
    });
  }

  private async validateUserContribution(
    userId: string,
    contributionId: string,
  ) {
    const userContribution = await this.prisma.userContribution.findUnique({
      where: {
        uk_user_contribution: {
          userId,
          contributionId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!userContribution) {
      throw new BadRequestException(
        'You must declare this contribution before adding an experience',
      );
    }

    return userContribution;
  }

  private validateDuration(
    durationValue?: number | null,
    durationUnit?: 'MONTH' | 'YEAR' | null,
  ) {
    if ((durationValue == null) !== (durationUnit == null)) {
      throw new BadRequestException(
        'durationValue and durationUnit must be provided together',
      );
    }
  }
}
