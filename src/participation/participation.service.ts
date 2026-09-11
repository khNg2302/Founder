import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';
import { ProjectClient } from 'src/project/project.client';

import { CreateParticipationDto } from './dto/create-participation.dto';
import { CreateParticipationContributionDto } from './dto/create-participation-contribution.dto';

@Injectable()
export class ParticipationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectClient: ProjectClient,
  ) {}

  async create(
    projectId: string,
    dto: CreateParticipationDto,
    userId: string,
    accessToken: string,
  ) {
    const project = await this.projectClient.findById(projectId, accessToken);

    if (project.ownerId === userId) {
      throw new BadRequestException(
        'Project owner cannot create a participation request',
      );
    }

    const existingParticipation = await this.prisma.participation.findFirst({
      where: {
        userId,
        projectId,
        status: {
          in: ['REQUESTED', 'ACTIVE'],
        },
      },
    });

    if (existingParticipation) {
      throw new ConflictException(
        'You already have an active participation or pending request for this project',
      );
    }

    const role =
      dto.intent === 'BECOME_COFOUNDER' ? 'COFOUNDER' : 'TEAM_MEMBER';

    return this.prisma.participation.create({
      data: {
        userId,
        projectId,
        intent: dto.intent,
        role,
        status: 'REQUESTED',
      },
    });
  }

  async findById(id: string, userId: string) {
    const participation = await this.prisma.participation.findUnique({
      where: { id },
    });

    if (!participation) {
      throw new NotFoundException(`Participation '${id}' not found`);
    }

    if (participation.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this participation',
      );
    }

    return participation;
  }

  async findMyParticipations(userId: string) {
    return this.prisma.participation.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findProjectParticipations(
    projectId: string,
    userId: string,
    accessToken: string,
  ) {
    const project = await this.projectClient.findById(projectId, accessToken);

    if (project.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the project owner can view project participations',
      );
    }

    return this.prisma.participation.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async cancel(id: string, userId: string) {
    const participation = await this.getParticipationOrThrow(id);

    this.ensureParticipant(participation, userId);

    this.ensureStatus(
      participation.status,
      'REQUESTED',
      'Only a requested participation can be cancelled',
    );

    return this.prisma.participation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  async approve(id: string, userId: string, accessToken: string) {
    const participation = await this.getParticipationOrThrow(id);

    await this.ensureProjectOwner(participation.projectId, userId, accessToken);

    this.ensureStatus(
      participation.status,
      'REQUESTED',
      'Only a requested participation can be approved',
    );

    const existingActive = await this.prisma.participation.findFirst({
      where: {
        id: {
          not: participation.id,
        },
        userId: participation.userId,
        projectId: participation.projectId,
        status: 'ACTIVE',
      },
    });

    if (existingActive) {
      throw new ConflictException(
        'This user already has an active participation in this project',
      );
    }

    return this.prisma.participation.update({
      where: { id },
      data: {
        status: 'ACTIVE',
      },
    });
  }

  async reject(id: string, userId: string, accessToken: string) {
    const participation = await this.getParticipationOrThrow(id);

    await this.ensureProjectOwner(participation.projectId, userId, accessToken);

    this.ensureStatus(
      participation.status,
      'REQUESTED',
      'Only a requested participation can be rejected',
    );

    return this.prisma.participation.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
    });
  }

  async leave(id: string, userId: string) {
    const participation = await this.getParticipationOrThrow(id);

    this.ensureParticipant(participation, userId);

    this.ensureStatus(
      participation.status,
      'ACTIVE',
      'Only an active participation can be left',
    );

    return this.prisma.participation.update({
      where: { id },
      data: {
        status: 'LEFT',
      },
    });
  }

  async remove(id: string, userId: string, accessToken: string) {
    const participation = await this.getParticipationOrThrow(id);

    await this.ensureProjectOwner(participation.projectId, userId, accessToken);

    this.ensureStatus(
      participation.status,
      'ACTIVE',
      'Only an active participation can be removed',
    );

    return this.prisma.participation.update({
      where: { id },
      data: {
        status: 'REMOVED',
      },
    });
  }

  private async getParticipationOrThrow(id: string) {
    const participation = await this.prisma.participation.findUnique({
      where: { id },
    });

    if (!participation) {
      throw new NotFoundException(`Participation '${id}' not found`);
    }

    return participation;
  }

  private ensureParticipant(
    participation: {
      userId: string;
    },
    userId: string,
  ) {
    if (participation.userId !== userId) {
      throw new ForbiddenException(
        'Only the participant can perform this action',
      );
    }
  }

  private ensureStatus(
    currentStatus: string,
    expectedStatus: string,
    message: string,
  ) {
    if (currentStatus !== expectedStatus) {
      throw new BadRequestException(message);
    }
  }

  private async ensureProjectOwner(
    projectId: string,
    userId: string,
    accessToken: string,
  ) {
    const project = await this.projectClient.findById(projectId, accessToken);

    if (project.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the project owner can perform this action',
      );
    }

    return project;
  }

  async addContribution(
    participationId: string,
    dto: CreateParticipationContributionDto,
    userId: string,
  ) {
    const participation = await this.getParticipationOrThrow(participationId);

    this.ensureParticipant(participation, userId);

    this.ensureStatus(
      participation.status,
      'ACTIVE',
      'Only an active participation can add contributions',
    );

    const userContribution = await this.prisma.userContribution.findUnique({
      where: {
        id: dto.userContributionId,
      },
    });

    if (!userContribution) {
      throw new NotFoundException(
        `User contribution '${dto.userContributionId}' not found`,
      );
    }

    if (userContribution.userId !== participation.userId) {
      throw new BadRequestException(
        'This user contribution is not available for this participation',
      );
    }

    try {
      return await this.prisma.participationContribution.create({
        data: {
          participationId,
          userContributionId: dto.userContributionId,
        },
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This contribution has already been added to the participation',
        );
      }

      throw error;
    }
  }

  async findContributions(participationId: string, userId: string) {
    const participation = await this.getParticipationOrThrow(participationId);

    this.ensureParticipant(participation, userId);

    return this.prisma.participationContribution.findMany({
      where: {
        participationId,
      },
    });
  }

  async removeContribution(
    participationId: string,
    userContributionId: string,
    userId: string,
  ) {
    const participation = await this.getParticipationOrThrow(participationId);

    this.ensureParticipant(participation, userId);

    this.ensureStatus(
      participation.status,
      'ACTIVE',
      'Only an active participation can remove contributions',
    );

    const participationContribution =
      await this.prisma.participationContribution.findFirst({
        where: {
          participationId,
          userContributionId,
        },
      });

    if (!participationContribution) {
      throw new NotFoundException(
        'This contribution has not been added to the participation',
      );
    }

    await this.prisma.participationContribution.delete({
      where: {
        id: participationContribution.id,
      },
    });
  }
}
