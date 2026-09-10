import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';

import {
  CreateAssessmentQuestionDto,
  CreateAssessmentOptionDto,
} from './dto/create-assessment-question.dto';

import { UpdateAssessmentQuestionDto } from './dto/update-assessment-question.dto';
import { AssessmentQuestionType } from 'generated/prisma/enums';

@Injectable()
export class AssessmentQuestionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(assessmentId: string) {
    await this.validateAssessment(assessmentId);

    return this.prisma.assessmentQuestion.findMany({
      where: {
        assessmentId,
      },
      include: {
        options: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async findById(assessmentId: string, questionId: string) {
    const question = await this.prisma.assessmentQuestion.findFirst({
      where: {
        id: questionId,
        assessmentId,
      },
      include: {
        options: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`Question '${questionId}' not found`);
    }

    return question;
  }

  async create(assessmentId: string, dto: CreateAssessmentQuestionDto) {
    await this.validateAssessmentCanBeModified(assessmentId);

    this.validateQuestionOptions(dto.type, dto.options);
    this.validateUniqueOrders(dto.order, dto.options);

    const content = dto.content.trim();

    if (!content) {
      throw new BadRequestException('Question content must not be blank');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const question = await tx.assessmentQuestion.create({
          data: {
            assessmentId,
            content,
            type: dto.type,
            order: dto.order,
            options: {
              create: dto.options.map((option) => ({
                content: option.content.trim(),
                isCorrect: option.isCorrect,
                order: option.order,
              })),
            },
          },
          include: {
            options: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        });

        return question;
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(
    assessmentId: string,
    questionId: string,
    dto: UpdateAssessmentQuestionDto,
  ) {
    await this.validateAssessmentCanBeModified(assessmentId);

    const existing = await this.findById(assessmentId, questionId);

    const type = dto.type !== undefined ? dto.type : existing.type;

    const options = dto.options !== undefined ? dto.options : existing.options;

    this.validateQuestionOptions(type, options);

    if (dto.order !== undefined) {
      this.validateUniqueOrders(dto.order, options);
    }

    const data: {
      content?: string;
      type?: AssessmentQuestionType;
      order?: number;
    } = {};

    if (dto.content !== undefined) {
      const content = dto.content.trim();

      if (!content) {
        throw new BadRequestException('Question content must not be blank');
      }

      data.content = content;
    }

    if (dto.type !== undefined) {
      data.type = dto.type;
    }

    if (dto.order !== undefined) {
      data.order = dto.order;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const question = await tx.assessmentQuestion.update({
          where: {
            id: questionId,
          },
          data,
        });

        if (dto.options !== undefined) {
          await tx.assessmentOption.deleteMany({
            where: {
              questionId,
            },
          });

          await tx.assessmentOption.createMany({
            data: dto.options.map((option) => ({
              questionId,
              content: option.content.trim(),
              isCorrect: option.isCorrect,
              order: option.order,
            })),
          });
        }

        return tx.assessmentQuestion.findUniqueOrThrow({
          where: {
            id: question.id,
          },
          include: {
            options: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        });
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async delete(assessmentId: string, questionId: string) {
    await this.validateAssessmentCanBeModified(assessmentId);

    await this.findById(assessmentId, questionId);

    await this.prisma.assessmentQuestion.delete({
      where: {
        id: questionId,
      },
    });
  }

  private async validateAssessment(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: {
        id: assessmentId,
      },
      select: {
        id: true,
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment '${assessmentId}' not found`);
    }

    return assessment;
  }

  private async validateAssessmentCanBeModified(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: {
        id: assessmentId,
      },
      select: {
        id: true,
        _count: {
          select: {
            results: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment '${assessmentId}' not found`);
    }

    if (assessment._count.results > 0) {
      throw new BadRequestException(
        'Assessment cannot be modified after it has results',
      );
    }

    return assessment;
  }

  private validateQuestionOptions(
    type: AssessmentQuestionType,
    options: Array<CreateAssessmentOptionDto>,
  ) {
    if (options.length < 2) {
      throw new BadRequestException('Question must have at least 2 options');
    }

    const correctOptions = options.filter((option) => option.isCorrect);

    if (correctOptions.length === 0) {
      throw new BadRequestException(
        'Question must have at least 1 correct option',
      );
    }

    if (
      type === AssessmentQuestionType.SINGLE_CHOICE &&
      correctOptions.length !== 1
    ) {
      throw new BadRequestException(
        'SINGLE_CHOICE question must have exactly 1 correct option',
      );
    }
  }

  private validateUniqueOrders(
    questionOrder: number,
    options: Array<CreateAssessmentOptionDto>,
  ) {
    const optionOrders = options.map((option) => option.order);

    if (new Set(optionOrders).size !== optionOrders.length) {
      throw new BadRequestException('Option orders must be unique');
    }

    if (optionOrders.some((order) => order < 0)) {
      throw new BadRequestException('Option order must not be negative');
    }

    if (questionOrder < 0) {
      throw new BadRequestException('Question order must not be negative');
    }
  }

  private handlePrismaError(error: unknown): never {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Question or option order already exists');
      }
    }

    throw error;
  }
}
