import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';

import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.assessment.findMany({
      include: {
        contribution: true,
        _count: {
          select: {
            questions: true,
            results: true,
          },
        },
      },
      orderBy: [{ contributionId: 'asc' }, { version: 'desc' }],
    });
  }

  async findById(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        contribution: true,
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment '${id}' not found`);
    }

    return assessment;
  }

  async create(dto: CreateAssessmentDto) {
    const contributionId = dto.contributionId.trim();
    const name = dto.name.trim();

    if (!contributionId) {
      throw new BadRequestException('Contribution ID must not be blank');
    }

    if (!name) {
      throw new BadRequestException('Assessment name must not be blank');
    }

    await this.validateContribution(contributionId);

    try {
      return await this.prisma.assessment.create({
        data: {
          contributionId,
          name,
          version: dto.version,
          passingScore: dto.passingScore,
        },
        include: {
          contribution: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: string, dto: UpdateAssessmentDto) {
    const existing = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            results: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Assessment '${id}' not found`);
    }

    if (existing._count.results > 0) {
      throw new BadRequestException(
        'Assessment cannot be modified after it has results',
      );
    }

    const data: {
      contributionId?: string;
      name?: string;
      version?: number;
      passingScore?: number;
    } = {};

    if (dto.contributionId !== undefined) {
      const contributionId = dto.contributionId.trim();

      if (!contributionId) {
        throw new BadRequestException('Contribution ID must not be blank');
      }

      await this.validateContribution(contributionId);
      data.contributionId = contributionId;
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      if (!name) {
        throw new BadRequestException('Assessment name must not be blank');
      }

      data.name = name;
    }

    if (dto.version !== undefined) {
      data.version = dto.version;
    }

    if (dto.passingScore !== undefined) {
      data.passingScore = dto.passingScore;
    }

    try {
      return await this.prisma.assessment.update({
        where: { id },
        data,
        include: {
          contribution: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private async validateContribution(contributionId: string) {
    const contribution = await this.prisma.contribution.findUnique({
      where: {
        id: contributionId,
      },
      select: {
        id: true,
      },
    });

    if (!contribution) {
      throw new BadRequestException(
        `Contribution '${contributionId}' not found`,
      );
    }

    return contribution;
  }

  private handlePrismaError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Assessment version already exists for this contribution',
      );
    }

    throw error;
  }
}
