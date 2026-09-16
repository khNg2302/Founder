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
import { CreateCommunityFeedbackDto } from './dto/create-community-feedback.dto';
import { UpdateCommunityFeedbackDto } from './dto/update-community-feedback.dto';
import {
  ParticipationIntent,
  ParticipationRole,
  ParticipationStatus,
  Prisma,
} from 'generated/prisma/client';
import { ParticipationResponseDto } from './dto/participation-response.dto';
import { ProjectParticipationResponseDto } from './dto/project-participation-response.dto';
import { ParticipationContributionResponseDto } from './dto/participation-contribution-response.dto';
import { CommunityFeedbackResponseDto } from './dto/community-feedback-response.dto';

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

    if (project.activityStatus !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'This project is not accepting participation requests',
      );
    }

    if (project.owner.id === userId) {
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

    try {
      const participation = await this.prisma.participation.create({
        data: {
          userId,
          projectId,
          intent: dto.intent,
          role,
          status: 'REQUESTED',
        },
      });

      return this.toParticipationResponse(participation);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'You already have an active participation or pending request for this project',
        );
      }

      throw error;
    }
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

    return this.toParticipationResponse(participation);
  }

  async findMyParticipations(userId: string) {
    const participations = await this.prisma.participation.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return participations.map((participation) =>
      this.toParticipationResponse(participation),
    );
  }

  async findProjectParticipations(
    projectId: string,
    userId: string,
    accessToken: string,
  ) {
    const project = await this.projectClient.findById(projectId, accessToken);

    if (project.owner.id !== userId) {
      throw new ForbiddenException(
        'Only the project owner can view project participations',
      );
    }

    const participations = await this.prisma.participation.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return participations.map((participation) =>
      this.toProjectParticipationResponse(participation),
    );
  }

  async cancel(id: string, userId: string) {
    const participation = await this.getParticipationOrThrow(id);

    this.ensureParticipant(participation, userId);

    this.ensureStatus(
      participation.status,
      'REQUESTED',
      'Only a requested participation can be cancelled',
    );

    const updated = await this.prisma.participation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    return this.toParticipationResponse(updated);
  }

  async approve(id: string, userId: string, accessToken: string) {
    const participation = await this.getParticipationOrThrow(id);

    const project = await this.ensureProjectOwner(
      participation.projectId,
      userId,
      accessToken,
    );

    if (project.activityStatus !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'This project is not accepting participation requests',
      );
    }

    this.ensureStatus(
      participation.status,
      'REQUESTED',
      'Only requested participation can be approved',
    );

    const existingActive = await this.prisma.participation.findFirst({
      where: {
        userId: participation.userId,
        projectId: participation.projectId,
        status: 'ACTIVE',
        id: {
          not: participation.id,
        },
      },
    });

    if (existingActive) {
      throw new ConflictException(
        'This user already has an active participation in this project',
      );
    }

    try {
      const updated = await this.prisma.participation.update({
        where: {
          id: participation.id,
        },
        data: {
          status: 'ACTIVE',
        },
      });

      return this.toParticipationResponse(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This user already has an active participation in this project',
        );
      }

      throw error;
    }
  }

  async reject(id: string, userId: string, accessToken: string) {
    const participation = await this.getParticipationOrThrow(id);

    await this.ensureProjectOwner(participation.projectId, userId, accessToken);

    this.ensureStatus(
      participation.status,
      'REQUESTED',
      'Only a requested participation can be rejected',
    );

    const updated = await this.prisma.participation.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
    });

    return this.toParticipationResponse(updated);
  }

  async leave(id: string, userId: string) {
    const participation = await this.getParticipationOrThrow(id);

    this.ensureParticipant(participation, userId);

    this.ensureStatus(
      participation.status,
      'ACTIVE',
      'Only an active participation can be left',
    );

    const updated = await this.prisma.participation.update({
      where: { id },
      data: {
        status: 'LEFT',
      },
    });

    return this.toParticipationResponse(updated);
  }

  async remove(id: string, userId: string, accessToken: string) {
    const participation = await this.getParticipationOrThrow(id);

    await this.ensureProjectOwner(participation.projectId, userId, accessToken);

    this.ensureStatus(
      participation.status,
      'ACTIVE',
      'Only an active participation can be removed',
    );

    const updated = await this.prisma.participation.update({
      where: { id },
      data: {
        status: 'REMOVED',
      },
    });

    return this.toParticipationResponse(updated);
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

    if (project.owner.id !== userId) {
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
      const participationContribution =
        await this.prisma.participationContribution.create({
          data: {
            participationId,
            userContributionId: dto.userContributionId,
          },
        });

      return this.toParticipationContributionResponse(
        participationContribution,
      );
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

    const contributions = await this.prisma.participationContribution.findMany({
      where: {
        participationId,
      },
    });

    return contributions.map((contribution) =>
      this.toParticipationContributionResponse(contribution),
    );
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

    return {
      message: 'Contribution removed successfully',
    };
  }

  async createFeedback(
    participationId: string,
    dto: CreateCommunityFeedbackDto,
    reviewerId: string,
  ) {
    const participation = await this.getParticipationOrThrow(participationId);

    this.ensureFeedbackAllowedStatus(participation.status);

    this.ensureParticipant(participation, reviewerId);

    if (dto.reviewedUserId === reviewerId) {
      throw new BadRequestException('You cannot give feedback to yourself');
    }

    const reviewedUser = await this.prisma.user.findUnique({
      where: {
        id: dto.reviewedUserId,
      },
    });

    if (!reviewedUser) {
      throw new NotFoundException(`User '${dto.reviewedUserId}' not found`);
    }

    const participantIds = await this.getParticipationUserIds(participation);

    if (!participantIds.includes(dto.reviewedUserId)) {
      throw new BadRequestException(
        'The reviewed user did not participate in this project',
      );
    }

    try {
      const feedback = await this.prisma.communityFeedback.create({
        data: {
          participationId,
          reviewerId,
          reviewedUserId: dto.reviewedUserId,
          communication: dto.communication,
          reliability: dto.reliability,
          collaboration: dto.collaboration,
          professionalism: dto.professionalism,
          comment: dto.comment?.trim() || null,
        },
      });

      return this.toCommunityFeedbackResponse(feedback);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'You have already given feedback to this user for this participation',
        );
      }

      throw error;
    }
  }

  private ensureFeedbackAllowedStatus(status: string) {
    if (status !== 'LEFT' && status !== 'COMPLETED' && status !== 'REMOVED') {
      throw new BadRequestException(
        'Feedback can only be given after the participation has ended',
      );
    }
  }

  private async getParticipationUserIds(participation: { projectId: string }) {
    const participations = await this.prisma.participation.findMany({
      where: {
        projectId: participation.projectId,
        status: {
          in: ['ACTIVE', 'LEFT', 'COMPLETED', 'REMOVED'],
        },
      },
      select: {
        userId: true,
      },
    });

    return participations.map((item) => item.userId);
  }

  async findFeedbacks(participationId: string, userId: string) {
    const participation = await this.getParticipationOrThrow(participationId);

    this.ensureParticipant(participation, userId);

    const feedbacks = await this.prisma.communityFeedback.findMany({
      where: {
        participationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return feedbacks.map((feedback) =>
      this.toCommunityFeedbackResponse(feedback),
    );
  }

  async updateFeedback(
    participationId: string,
    feedbackId: string,
    dto: UpdateCommunityFeedbackDto,
    reviewerId: string,
  ) {
    const participation = await this.getParticipationOrThrow(participationId);

    this.ensureFeedbackAllowedStatus(participation.status);

    this.ensureParticipant(participation, reviewerId);

    const feedback = await this.prisma.communityFeedback.findUnique({
      where: {
        id: feedbackId,
      },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback '${feedbackId}' not found`);
    }

    if (feedback.participationId !== participationId) {
      throw new NotFoundException(`Feedback '${feedbackId}' not found`);
    }

    if (feedback.reviewerId !== reviewerId) {
      throw new ForbiddenException(
        'Only the feedback reviewer can update this feedback',
      );
    }

    const updatedFeedback = await this.prisma.communityFeedback.update({
      where: {
        id: feedbackId,
      },
      data: {
        ...(dto.communication !== undefined && {
          communication: dto.communication,
        }),
        ...(dto.reliability !== undefined && {
          reliability: dto.reliability,
        }),
        ...(dto.collaboration !== undefined && {
          collaboration: dto.collaboration,
        }),
        ...(dto.professionalism !== undefined && {
          professionalism: dto.professionalism,
        }),
        ...(dto.comment !== undefined && {
          comment: dto.comment.trim() || null,
        }),
      },
    });

    return this.toCommunityFeedbackResponse(updatedFeedback);
  }
  async deleteFeedback(
    participationId: string,
    feedbackId: string,
    reviewerId: string,
  ) {
    const participation = await this.getParticipationOrThrow(participationId);

    this.ensureParticipant(participation, reviewerId);

    const feedback = await this.prisma.communityFeedback.findUnique({
      where: {
        id: feedbackId,
      },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback '${feedbackId}' not found`);
    }

    if (feedback.participationId !== participationId) {
      throw new NotFoundException(`Feedback '${feedbackId}' not found`);
    }

    if (feedback.reviewerId !== reviewerId) {
      throw new ForbiddenException(
        'Only the feedback reviewer can delete this feedback',
      );
    }

    await this.prisma.communityFeedback.delete({
      where: {
        id: feedbackId,
      },
    });

    return {
      message: 'Feedback deleted successfully',
    };
  }

  private toParticipationResponse(participation: {
    id: string;
    intent: ParticipationIntent;
    role: ParticipationRole;
    status: ParticipationStatus;
    createdAt: Date;
    updatedAt: Date;
  }): ParticipationResponseDto {
    return {
      id: participation.id,
      intent: participation.intent,
      role: participation.role,
      status: participation.status,
      createdAt: participation.createdAt,
      updatedAt: participation.updatedAt,
    };
  }

  private toProjectParticipationResponse(participation: {
    id: string;
    intent: ParticipationIntent;
    role: ParticipationRole;
    status: ParticipationStatus;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      fullName: string | null;
      nickname: string | null;
    };
  }): ProjectParticipationResponseDto {
    return {
      id: participation.id,
      user: {
        id: participation.user.id,
        name: participation.user.fullName ?? participation.user.nickname,
      },
      intent: participation.intent,
      role: participation.role,
      status: participation.status,
      createdAt: participation.createdAt,
      updatedAt: participation.updatedAt,
    };
  }

  private toParticipationContributionResponse(contribution: {
    id: string;
    participationId: string;
    userContributionId: string;
  }): ParticipationContributionResponseDto {
    return {
      id: contribution.id,
      participationId: contribution.participationId,
      userContributionId: contribution.userContributionId,
    };
  }

  private toCommunityFeedbackResponse(feedback: {
    id: string;
    participationId: string;
    reviewerId: string;
    reviewedUserId: string;
    communication: number;
    reliability: number;
    collaboration: number;
    professionalism: number;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): CommunityFeedbackResponseDto {
    return {
      id: feedback.id,
      participationId: feedback.participationId,
      reviewerId: feedback.reviewerId,
      reviewedUserId: feedback.reviewedUserId,
      communication: feedback.communication,
      reliability: feedback.reliability,
      collaboration: feedback.collaboration,
      professionalism: feedback.professionalism,
      comment: feedback.comment,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    };
  }
}
