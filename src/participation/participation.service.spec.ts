import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { ParticipationService } from './participation.service';
import { PrismaService } from 'prisma/prisma.service';
import { ProjectClient } from 'src/project/project.client';

describe('ParticipationService', () => {
  let service: ParticipationService;

  let prisma: {
    participation: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    userContribution: {
      findUnique: jest.Mock;
    };
    participationContribution: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
    communityFeedback: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  let projectClient: {
    findById: jest.Mock;
  };

  const userId = 'user-1';
  const ownerId = 'owner-1';
  const projectId = 'project-1';
  const participationId = 'participation-1';
  const accessToken = 'access-token';

  const inProgressProject = {
    id: projectId,
    name: 'Green Education',
    owner: {
      id: ownerId,
      name: 'Project Owner',
    },
    activityStatus: 'IN_PROGRESS',
  };

  const requestedParticipation = {
    id: participationId,
    userId,
    projectId,
    intent: 'JOIN_TEAM',
    role: 'TEAM_MEMBER',
    status: 'REQUESTED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const activeParticipation = {
    ...requestedParticipation,
    status: 'ACTIVE',
  };

  beforeEach(() => {
    prisma = {
      participation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },

      userContribution: {
        findUnique: jest.fn(),
      },

      participationContribution: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },

      user: {
        findUnique: jest.fn(),
      },

      communityFeedback: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    projectClient = {
      findById: jest.fn(),
    };

    service = new ParticipationService(
      prisma as unknown as PrismaService,
      projectClient as unknown as ProjectClient,
    );
  });

  describe('create', () => {
    it('should create a REQUESTED participation', async () => {
      projectClient.findById.mockResolvedValue(inProgressProject);

      prisma.participation.findFirst.mockResolvedValue(null);

      prisma.participation.create.mockResolvedValue(requestedParticipation);

      const result = await service.create(
        projectId,
        {
          intent: 'JOIN_TEAM',
        },
        userId,
        accessToken,
      );

      expect(projectClient.findById).toHaveBeenCalledWith(
        projectId,
        accessToken,
      );

      expect(prisma.participation.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          projectId,
          status: {
            in: ['REQUESTED', 'ACTIVE'],
          },
        },
      });

      expect(prisma.participation.create).toHaveBeenCalledWith({
        data: {
          userId,
          projectId,
          intent: 'JOIN_TEAM',
          role: 'TEAM_MEMBER',
          status: 'REQUESTED',
        },
      });

      expect(result).toEqual(requestedParticipation);
    });

    it('should create COFOUNDER role for BECOME_COFOUNDER intent', async () => {
      projectClient.findById.mockResolvedValue(inProgressProject);

      prisma.participation.findFirst.mockResolvedValue(null);

      prisma.participation.create.mockResolvedValue({
        ...requestedParticipation,
        intent: 'BECOME_COFOUNDER',
        role: 'COFOUNDER',
      });

      await service.create(
        projectId,
        {
          intent: 'BECOME_COFOUNDER',
        },
        userId,
        accessToken,
      );

      expect(prisma.participation.create).toHaveBeenCalledWith({
        data: {
          userId,
          projectId,
          intent: 'BECOME_COFOUNDER',
          role: 'COFOUNDER',
          status: 'REQUESTED',
        },
      });
    });

    it('should reject when project is PAUSED', async () => {
      projectClient.findById.mockResolvedValue({
        ...inProgressProject,
        activityStatus: 'PAUSED',
      });

      await expect(
        service.create(
          projectId,
          {
            intent: 'JOIN_TEAM',
          },
          userId,
          accessToken,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'This project is not accepting participation requests',
        ),
      );

      expect(prisma.participation.create).not.toHaveBeenCalled();
    });

    it('should reject when project is COMPLETED', async () => {
      projectClient.findById.mockResolvedValue({
        ...inProgressProject,
        activityStatus: 'COMPLETED',
      });

      await expect(
        service.create(
          projectId,
          {
            intent: 'JOIN_TEAM',
          },
          userId,
          accessToken,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'This project is not accepting participation requests',
        ),
      );

      expect(prisma.participation.create).not.toHaveBeenCalled();
    });

    it('should reject when project is CANCELLED', async () => {
      projectClient.findById.mockResolvedValue({
        ...inProgressProject,
        activityStatus: 'CANCELLED',
      });

      await expect(
        service.create(
          projectId,
          {
            intent: 'JOIN_TEAM',
          },
          userId,
          accessToken,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'This project is not accepting participation requests',
        ),
      );

      expect(prisma.participation.create).not.toHaveBeenCalled();
    });

    it('should reject when project owner tries to apply', async () => {
      projectClient.findById.mockResolvedValue(inProgressProject);

      await expect(
        service.create(
          projectId,
          {
            intent: 'JOIN_TEAM',
          },
          ownerId,
          accessToken,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Project owner cannot create a participation request',
        ),
      );

      expect(prisma.participation.findFirst).not.toHaveBeenCalled();
      expect(prisma.participation.create).not.toHaveBeenCalled();
    });

    it('should reject when user already has REQUESTED participation', async () => {
      projectClient.findById.mockResolvedValue(inProgressProject);

      prisma.participation.findFirst.mockResolvedValue(requestedParticipation);

      await expect(
        service.create(
          projectId,
          {
            intent: 'JOIN_TEAM',
          },
          userId,
          accessToken,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'You already have an active participation or pending request for this project',
        ),
      );

      expect(prisma.participation.create).not.toHaveBeenCalled();
    });

    it('should reject when user already has ACTIVE participation', async () => {
      projectClient.findById.mockResolvedValue(inProgressProject);

      prisma.participation.findFirst.mockResolvedValue(activeParticipation);

      await expect(
        service.create(
          projectId,
          {
            intent: 'JOIN_TEAM',
          },
          userId,
          accessToken,
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.participation.create).not.toHaveBeenCalled();
    });

    it('should allow re-apply after REJECTED participation', async () => {
      projectClient.findById.mockResolvedValue(inProgressProject);

      prisma.participation.findFirst.mockResolvedValue(null);

      prisma.participation.create.mockResolvedValue(requestedParticipation);

      await service.create(
        projectId,
        {
          intent: 'JOIN_TEAM',
        },
        userId,
        accessToken,
      );

      expect(prisma.participation.create).toHaveBeenCalled();
    });

    it('should allow re-apply after CANCELLED participation', async () => {
      projectClient.findById.mockResolvedValue(inProgressProject);

      prisma.participation.findFirst.mockResolvedValue(null);

      prisma.participation.create.mockResolvedValue(requestedParticipation);

      await service.create(
        projectId,
        {
          intent: 'JOIN_TEAM',
        },
        userId,
        accessToken,
      );

      expect(prisma.participation.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return participation for its participant', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      const result = await service.findById(participationId, userId);

      expect(prisma.participation.findUnique).toHaveBeenCalledWith({
        where: {
          id: participationId,
        },
      });

      expect(result).toEqual(requestedParticipation);
    });

    it('should throw NotFoundException when participation does not exist', async () => {
      prisma.participation.findUnique.mockResolvedValue(null);

      await expect(service.findById(participationId, userId)).rejects.toThrow(
        new NotFoundException(`Participation '${participationId}' not found`),
      );
    });

    it('should throw ForbiddenException when another user accesses participation', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      await expect(
        service.findById(participationId, 'another-user'),
      ).rejects.toThrow(
        new ForbiddenException('You do not have access to this participation'),
      );
    });
  });

  describe('findMyParticipations', () => {
    it('should return user participations ordered by newest first', async () => {
      prisma.participation.findMany.mockResolvedValue([requestedParticipation]);

      const result = await service.findMyParticipations(userId);

      expect(prisma.participation.findMany).toHaveBeenCalledWith({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toEqual([requestedParticipation]);
    });

    it('should return empty list when user has no participations', async () => {
      prisma.participation.findMany.mockResolvedValue([]);

      const result = await service.findMyParticipations(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findProjectParticipations', () => {
    it('should return project participations for project owner', async () => {
      projectClient.findById.mockResolvedValue(inProgressProject);

      prisma.participation.findMany.mockResolvedValue([requestedParticipation]);

      const result = await service.findProjectParticipations(
        projectId,
        ownerId,
        accessToken,
      );

      expect(projectClient.findById).toHaveBeenCalledWith(
        projectId,
        accessToken,
      );

      expect(prisma.participation.findMany).toHaveBeenCalledWith({
        where: {
          projectId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toEqual([requestedParticipation]);
    });

    it('should reject non-owner', async () => {
      projectClient.findById.mockResolvedValue(inProgressProject);

      await expect(
        service.findProjectParticipations(projectId, userId, accessToken),
      ).rejects.toThrow(
        new ForbiddenException(
          'Only the project owner can view project participations',
        ),
      );

      expect(prisma.participation.findMany).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel a REQUESTED participation', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      prisma.participation.update.mockResolvedValue({
        ...requestedParticipation,
        status: 'CANCELLED',
      });

      const result = await service.cancel(participationId, userId);

      expect(prisma.participation.update).toHaveBeenCalledWith({
        where: {
          id: participationId,
        },
        data: {
          status: 'CANCELLED',
        },
      });

      expect(result.status).toBe('CANCELLED');
    });

    it('should reject cancel by another user', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      await expect(
        service.cancel(participationId, 'another-user'),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.participation.update).not.toHaveBeenCalled();
    });

    it('should reject cancelling ACTIVE participation', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      await expect(service.cancel(participationId, userId)).rejects.toThrow(
        new BadRequestException(
          'Only a requested participation can be cancelled',
        ),
      );
    });

    it('should throw NotFoundException when participation does not exist', async () => {
      prisma.participation.findUnique.mockResolvedValue(null);

      await expect(service.cancel(participationId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approve', () => {
    it('should approve a REQUESTED participation', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      projectClient.findById.mockResolvedValue(inProgressProject);

      prisma.participation.findFirst.mockResolvedValue(null);

      prisma.participation.update.mockResolvedValue(activeParticipation);

      const result = await service.approve(
        participationId,
        ownerId,
        accessToken,
      );

      expect(projectClient.findById).toHaveBeenCalledWith(
        projectId,
        accessToken,
      );

      expect(prisma.participation.findFirst).toHaveBeenCalledWith({
        where: {
          id: {
            not: participationId,
          },
          userId,
          projectId,
          status: 'ACTIVE',
        },
      });

      expect(prisma.participation.update).toHaveBeenCalledWith({
        where: {
          id: participationId,
        },
        data: {
          status: 'ACTIVE',
        },
      });

      expect(result).toEqual(activeParticipation);
    });

    it('should reject approval by non-owner', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      projectClient.findById.mockResolvedValue(inProgressProject);

      await expect(
        service.approve(participationId, userId, accessToken),
      ).rejects.toThrow(
        new ForbiddenException(
          'Only the project owner can perform this action',
        ),
      );

      expect(prisma.participation.update).not.toHaveBeenCalled();
    });

    it('should reject approval when participation is not REQUESTED', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      projectClient.findById.mockResolvedValue(inProgressProject);

      await expect(
        service.approve(participationId, ownerId, accessToken),
      ).rejects.toThrow(
        new BadRequestException(
          'Only a requested participation can be approved',
        ),
      );
    });

    it('should reject approval when user already has ACTIVE participation', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      projectClient.findById.mockResolvedValue(inProgressProject);

      prisma.participation.findFirst.mockResolvedValue(activeParticipation);

      await expect(
        service.approve(participationId, ownerId, accessToken),
      ).rejects.toThrow(
        new ConflictException(
          'This user already has an active participation in this project',
        ),
      );

      expect(prisma.participation.update).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('should reject a REQUESTED participation', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      projectClient.findById.mockResolvedValue(inProgressProject);

      prisma.participation.update.mockResolvedValue({
        ...requestedParticipation,
        status: 'REJECTED',
      });

      const result = await service.reject(
        participationId,
        ownerId,
        accessToken,
      );

      expect(prisma.participation.update).toHaveBeenCalledWith({
        where: {
          id: participationId,
        },
        data: {
          status: 'REJECTED',
        },
      });

      expect(result.status).toBe('REJECTED');
    });

    it('should reject rejection by non-owner', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      projectClient.findById.mockResolvedValue(inProgressProject);

      await expect(
        service.reject(participationId, userId, accessToken),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.participation.update).not.toHaveBeenCalled();
    });

    it('should reject when participation is not REQUESTED', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      projectClient.findById.mockResolvedValue(inProgressProject);

      await expect(
        service.reject(participationId, ownerId, accessToken),
      ).rejects.toThrow(
        new BadRequestException(
          'Only a requested participation can be rejected',
        ),
      );
    });
  });

  describe('leave', () => {
    it('should allow participant to leave ACTIVE participation', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      prisma.participation.update.mockResolvedValue({
        ...activeParticipation,
        status: 'LEFT',
      });

      const result = await service.leave(participationId, userId);

      expect(prisma.participation.update).toHaveBeenCalledWith({
        where: {
          id: participationId,
        },
        data: {
          status: 'LEFT',
        },
      });

      expect(result.status).toBe('LEFT');
    });

    it('should reject leave by another user', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      await expect(
        service.leave(participationId, 'another-user'),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.participation.update).not.toHaveBeenCalled();
    });

    it('should reject leave when participation is not ACTIVE', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      await expect(service.leave(participationId, userId)).rejects.toThrow(
        new BadRequestException('Only an active participation can be left'),
      );
    });
  });

  describe('remove', () => {
    it('should allow owner to remove ACTIVE participation', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      projectClient.findById.mockResolvedValue(inProgressProject);

      prisma.participation.update.mockResolvedValue({
        ...activeParticipation,
        status: 'REMOVED',
      });

      const result = await service.remove(
        participationId,
        ownerId,
        accessToken,
      );

      expect(prisma.participation.update).toHaveBeenCalledWith({
        where: {
          id: participationId,
        },
        data: {
          status: 'REMOVED',
        },
      });

      expect(result.status).toBe('REMOVED');
    });

    it('should reject remove by non-owner', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      projectClient.findById.mockResolvedValue(inProgressProject);

      await expect(
        service.remove(participationId, userId, accessToken),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.participation.update).not.toHaveBeenCalled();
    });

    it('should reject remove when participation is not ACTIVE', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      projectClient.findById.mockResolvedValue(inProgressProject);

      await expect(
        service.remove(participationId, ownerId, accessToken),
      ).rejects.toThrow(
        new BadRequestException('Only an active participation can be removed'),
      );
    });
  });

  describe('addContribution', () => {
    it('should add a user contribution to ACTIVE participation', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      prisma.userContribution.findUnique.mockResolvedValue({
        id: 'user-contribution-1',
        userId,
        contributionId: 'contribution-1',
      });

      prisma.participationContribution.create.mockResolvedValue({
        id: 'participation-contribution-1',
        participationId,
        userContributionId: 'user-contribution-1',
      });

      const result = await service.addContribution(
        participationId,
        {
          userContributionId: 'user-contribution-1',
        },
        userId,
      );

      expect(prisma.participationContribution.create).toHaveBeenCalledWith({
        data: {
          participationId,
          userContributionId: 'user-contribution-1',
        },
      });

      expect(result).toBeDefined();
    });

    it('should reject adding contribution to non-ACTIVE participation', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      await expect(
        service.addContribution(
          participationId,
          {
            userContributionId: 'user-contribution-1',
          },
          userId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Only an active participation can add contributions',
        ),
      );
    });

    it('should reject contribution belonging to another user', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      prisma.userContribution.findUnique.mockResolvedValue({
        id: 'user-contribution-1',
        userId: 'another-user',
        contributionId: 'contribution-1',
      });

      await expect(
        service.addContribution(
          participationId,
          {
            userContributionId: 'user-contribution-1',
          },
          userId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'This user contribution is not available for this participation',
        ),
      );

      expect(prisma.participationContribution.create).not.toHaveBeenCalled();
    });

    it('should reject when user contribution does not exist', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      prisma.userContribution.findUnique.mockResolvedValue(null);

      await expect(
        service.addContribution(
          participationId,
          {
            userContributionId: 'missing-contribution',
          },
          userId,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          "User contribution 'missing-contribution' not found",
        ),
      );
    });

    it('should convert duplicate contribution error to ConflictException', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      prisma.userContribution.findUnique.mockResolvedValue({
        id: 'user-contribution-1',
        userId,
        contributionId: 'contribution-1',
      });

      prisma.participationContribution.create.mockRejectedValue({
        code: 'P2002',
      });

      await expect(
        service.addContribution(
          participationId,
          {
            userContributionId: 'user-contribution-1',
          },
          userId,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'This contribution has already been added to the participation',
        ),
      );
    });
  });

  describe('findContributions', () => {
    it('should return participation contributions', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      const contributions = [
        {
          id: 'participation-contribution-1',
          participationId,
          userContributionId: 'user-contribution-1',
        },
      ];

      prisma.participationContribution.findMany.mockResolvedValue(
        contributions,
      );

      const result = await service.findContributions(participationId, userId);

      expect(prisma.participationContribution.findMany).toHaveBeenCalledWith({
        where: {
          participationId,
        },
      });

      expect(result).toEqual(contributions);
    });

    it('should reject another user', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      await expect(
        service.findContributions(participationId, 'another-user'),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.participationContribution.findMany).not.toHaveBeenCalled();
    });
  });

  describe('removeContribution', () => {
    it('should remove an existing contribution', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      prisma.participationContribution.findFirst.mockResolvedValue({
        id: 'participation-contribution-1',
        participationId,
        userContributionId: 'user-contribution-1',
      });

      await service.removeContribution(
        participationId,
        'user-contribution-1',
        userId,
      );

      expect(prisma.participationContribution.delete).toHaveBeenCalledWith({
        where: {
          id: 'participation-contribution-1',
        },
      });
    });

    it('should reject removing contribution from non-ACTIVE participation', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      await expect(
        service.removeContribution(
          participationId,
          'user-contribution-1',
          userId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Only an active participation can remove contributions',
        ),
      );
    });

    it('should throw when contribution does not exist', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      prisma.participationContribution.findFirst.mockResolvedValue(null);

      await expect(
        service.removeContribution(
          participationId,
          'user-contribution-1',
          userId,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'This contribution has not been added to the participation',
        ),
      );
    });
  });

  describe('createFeedback', () => {
    const endedParticipation = {
      ...requestedParticipation,
      status: 'LEFT',
    };

    it('should create feedback after participation has ended', async () => {
      prisma.participation.findUnique.mockResolvedValue(endedParticipation);

      prisma.user.findUnique.mockResolvedValue({
        id: 'reviewed-user',
      });

      prisma.participation.findMany.mockResolvedValue([
        {
          userId,
        },
        {
          userId: 'reviewed-user',
        },
      ]);

      const feedback = {
        id: 'feedback-1',
        participationId,
        reviewerId: userId,
        reviewedUserId: 'reviewed-user',
        communication: 5,
        reliability: 4,
        collaboration: 5,
        professionalism: 4,
        comment: 'Good teammate',
      };

      prisma.communityFeedback.create.mockResolvedValue(feedback);

      const result = await service.createFeedback(
        participationId,
        {
          reviewedUserId: 'reviewed-user',
          communication: 5,
          reliability: 4,
          collaboration: 5,
          professionalism: 4,
          comment: 'Good teammate',
        },
        userId,
      );

      expect(prisma.communityFeedback.create).toHaveBeenCalledWith({
        data: {
          participationId,
          reviewerId: userId,
          reviewedUserId: 'reviewed-user',
          communication: 5,
          reliability: 4,
          collaboration: 5,
          professionalism: 4,
          comment: 'Good teammate',
        },
      });

      expect(result).toEqual(feedback);
    });

    it('should reject feedback while participation is ACTIVE', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      await expect(
        service.createFeedback(
          participationId,
          {
            reviewedUserId: 'reviewed-user',
            communication: 5,
            reliability: 5,
            collaboration: 5,
            professionalism: 5,
          },
          userId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Feedback can only be given after the participation has ended',
        ),
      );
    });

    it('should reject self-feedback', async () => {
      prisma.participation.findUnique.mockResolvedValue(endedParticipation);

      await expect(
        service.createFeedback(
          participationId,
          {
            reviewedUserId: userId,
            communication: 5,
            reliability: 5,
            collaboration: 5,
            professionalism: 5,
          },
          userId,
        ),
      ).rejects.toThrow(
        new BadRequestException('You cannot give feedback to yourself'),
      );
    });

    it('should reject feedback for non-existing user', async () => {
      prisma.participation.findUnique.mockResolvedValue(endedParticipation);

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createFeedback(
          participationId,
          {
            reviewedUserId: 'missing-user',
            communication: 5,
            reliability: 5,
            collaboration: 5,
            professionalism: 5,
          },
          userId,
        ),
      ).rejects.toThrow(new NotFoundException("User 'missing-user' not found"));
    });

    it('should reject feedback for a user who did not participate in the project', async () => {
      prisma.participation.findUnique.mockResolvedValue(endedParticipation);

      prisma.user.findUnique.mockResolvedValue({
        id: 'outsider',
      });

      prisma.participation.findMany.mockResolvedValue([
        {
          userId,
        },
      ]);

      await expect(
        service.createFeedback(
          participationId,
          {
            reviewedUserId: 'outsider',
            communication: 5,
            reliability: 5,
            collaboration: 5,
            professionalism: 5,
          },
          userId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'The reviewed user did not participate in this project',
        ),
      );
    });

    it('should convert duplicate feedback error to ConflictException', async () => {
      prisma.participation.findUnique.mockResolvedValue(endedParticipation);

      prisma.user.findUnique.mockResolvedValue({
        id: 'reviewed-user',
      });

      prisma.participation.findMany.mockResolvedValue([
        {
          userId,
        },
        {
          userId: 'reviewed-user',
        },
      ]);

      prisma.communityFeedback.create.mockRejectedValue({
        code: 'P2002',
      });

      await expect(
        service.createFeedback(
          participationId,
          {
            reviewedUserId: 'reviewed-user',
            communication: 5,
            reliability: 5,
            collaboration: 5,
            professionalism: 5,
          },
          userId,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'You have already given feedback to this user for this participation',
        ),
      );
    });
  });

  describe('findFeedbacks', () => {
    it('should return feedbacks for participant', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      const feedbacks = [
        {
          id: 'feedback-1',
          participationId,
          reviewerId: userId,
          reviewedUserId: 'user-2',
        },
      ];

      prisma.communityFeedback.findMany.mockResolvedValue(feedbacks);

      const result = await service.findFeedbacks(participationId, userId);

      expect(prisma.communityFeedback.findMany).toHaveBeenCalledWith({
        where: {
          participationId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toEqual(feedbacks);
    });

    it('should reject another user', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      await expect(
        service.findFeedbacks(participationId, 'another-user'),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.communityFeedback.findMany).not.toHaveBeenCalled();
    });
  });

  describe('updateFeedback', () => {
    const endedParticipation = {
      ...requestedParticipation,
      status: 'LEFT',
    };

    const feedback = {
      id: 'feedback-1',
      participationId,
      reviewerId: userId,
      reviewedUserId: 'reviewed-user',
      communication: 4,
      reliability: 4,
      collaboration: 4,
      professionalism: 4,
      comment: 'Old comment',
    };

    it('should update feedback by its reviewer', async () => {
      prisma.participation.findUnique.mockResolvedValue(endedParticipation);

      prisma.communityFeedback.findUnique.mockResolvedValue(feedback);

      prisma.communityFeedback.update.mockResolvedValue({
        ...feedback,
        communication: 5,
        comment: 'Updated comment',
      });

      const result = await service.updateFeedback(
        participationId,
        'feedback-1',
        {
          communication: 5,
          comment: ' Updated comment ',
        },
        userId,
      );

      expect(prisma.communityFeedback.update).toHaveBeenCalledWith({
        where: {
          id: 'feedback-1',
        },
        data: {
          communication: 5,
          comment: 'Updated comment',
        },
      });

      expect(result.communication).toBe(5);
    });

    it('should reject update while participation has not ended', async () => {
      prisma.participation.findUnique.mockResolvedValue(activeParticipation);

      await expect(
        service.updateFeedback(
          participationId,
          'feedback-1',
          {
            communication: 5,
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when feedback does not exist', async () => {
      prisma.participation.findUnique.mockResolvedValue(endedParticipation);

      prisma.communityFeedback.findUnique.mockResolvedValue(null);

      await expect(
        service.updateFeedback(
          participationId,
          'feedback-1',
          {
            communication: 5,
          },
          userId,
        ),
      ).rejects.toThrow(
        new NotFoundException("Feedback 'feedback-1' not found"),
      );
    });

    it('should reject feedback from another participation', async () => {
      prisma.participation.findUnique.mockResolvedValue(endedParticipation);

      prisma.communityFeedback.findUnique.mockResolvedValue({
        ...feedback,
        participationId: 'another-participation',
      });

      await expect(
        service.updateFeedback(
          participationId,
          'feedback-1',
          {
            communication: 5,
          },
          userId,
        ),
      ).rejects.toThrow(
        new NotFoundException("Feedback 'feedback-1' not found"),
      );
    });

    it('should reject update by another reviewer', async () => {
      prisma.participation.findUnique.mockResolvedValue(endedParticipation);

      prisma.communityFeedback.findUnique.mockResolvedValue(feedback);

      await expect(
        service.updateFeedback(
          participationId,
          'feedback-1',
          {
            communication: 5,
          },
          'another-user',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.communityFeedback.update).not.toHaveBeenCalled();
    });

    it('should trim updated comment', async () => {
      prisma.participation.findUnique.mockResolvedValue(endedParticipation);

      prisma.communityFeedback.findUnique.mockResolvedValue(feedback);

      prisma.communityFeedback.update.mockResolvedValue({
        ...feedback,
        comment: 'Trimmed',
      });

      await service.updateFeedback(
        participationId,
        'feedback-1',
        {
          comment: '  Trimmed  ',
        },
        userId,
      );

      expect(prisma.communityFeedback.update).toHaveBeenCalledWith({
        where: {
          id: 'feedback-1',
        },
        data: {
          comment: 'Trimmed',
        },
      });
    });
  });

  describe('deleteFeedback', () => {
    const feedback = {
      id: 'feedback-1',
      participationId,
      reviewerId: userId,
      reviewedUserId: 'reviewed-user',
    };

    it('should delete feedback by its reviewer', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      prisma.communityFeedback.findUnique.mockResolvedValue(feedback);

      prisma.communityFeedback.delete.mockResolvedValue(feedback);

      await service.deleteFeedback(participationId, 'feedback-1', userId);

      expect(prisma.communityFeedback.delete).toHaveBeenCalledWith({
        where: {
          id: 'feedback-1',
        },
      });
    });

    it('should reject delete when feedback does not exist', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      prisma.communityFeedback.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteFeedback(participationId, 'feedback-1', userId),
      ).rejects.toThrow(
        new NotFoundException("Feedback 'feedback-1' not found"),
      );
    });

    it('should reject feedback from another participation', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      prisma.communityFeedback.findUnique.mockResolvedValue({
        ...feedback,
        participationId: 'another-participation',
      });

      await expect(
        service.deleteFeedback(participationId, 'feedback-1', userId),
      ).rejects.toThrow(
        new NotFoundException("Feedback 'feedback-1' not found"),
      );
    });

    it('should reject delete by another reviewer', async () => {
      prisma.participation.findUnique.mockResolvedValue(requestedParticipation);

      prisma.communityFeedback.findUnique.mockResolvedValue(feedback);

      await expect(
        service.deleteFeedback(participationId, 'feedback-1', 'another-user'),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.communityFeedback.delete).not.toHaveBeenCalled();
    });

    it.each(['PAUSED', 'COMPLETED', 'CANCELLED'])(
      'should reject approval when project activityStatus is %s',
      async (activityStatus) => {
        prisma.participation.findUnique.mockResolvedValue({
          id: 'participation-1',
          userId: 'user-1',
          projectId: 'project-1',
          status: 'REQUESTED',
        });

        projectClient.findById.mockResolvedValue({
          id: 'project-1',
          name: 'Test Project',
          owner: {
            id: 'owner-1',
          },
          activityStatus,
        });

        await expect(
          service.approve('participation-1', 'owner-1', 'access-token'),
        ).rejects.toThrow(BadRequestException);

        expect(prisma.participation.update).not.toHaveBeenCalled();
      },
    );
  });
});
