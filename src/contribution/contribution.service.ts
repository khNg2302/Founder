import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';
import { CategoryClient } from 'src/category/category.client';

import { CreateContributionDto } from './dto/create-contribution.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';

@Injectable()
export class ContributionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryClient: CategoryClient,
  ) {}

  async findAll() {
    return this.prisma.contribution.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findById(id: string) {
    const contribution = await this.prisma.contribution.findUnique({
      where: { id },
    });

    if (!contribution) {
      throw new NotFoundException(`Contribution '${id}' not found`);
    }

    return contribution;
  }

  async create(dto: CreateContributionDto, accessToken: string) {
    const field = await this.validateField(dto.fieldId, accessToken);

    const name = dto.name.trim();

    try {
      return await this.prisma.contribution.create({
        data: {
          fieldId: field.id,
          name,
          description: dto.description?.trim() || null,
        },
      });
    } catch (error) {
      this.handleUniqueConstraint(error);

      throw error;
    }
  }

  async update(id: string, dto: UpdateContributionDto, accessToken: string) {
    await this.findById(id);

    const data: {
      fieldId?: string;
      name?: string;
      description?: string | null;
    } = {};

    if (dto.fieldId !== undefined) {
      const field = await this.validateField(dto.fieldId, accessToken);
      data.fieldId = field.id;
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      if (!name) {
        throw new BadRequestException('Contribution name must not be blank');
      }

      data.name = name;
    }

    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }

    try {
      return await this.prisma.contribution.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handleUniqueConstraint(error);

      throw error;
    }
  }

  async delete(id: string) {
    await this.findById(id);

    try {
      await this.prisma.contribution.delete({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }

  private async validateField(fieldId: string, accessToken: string) {
    const field = await this.categoryClient.findById(fieldId, accessToken);

    if (field.type !== 'FIELD') {
      throw new BadRequestException(`Category '${fieldId}' must be a FIELD`);
    }

    return field;
  }

  private handleUniqueConstraint(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A contribution with the same name already exists in this field',
      );
    }
  }
}
