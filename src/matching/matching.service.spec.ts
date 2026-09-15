import { MatchingService } from './matching.service';

import { UserMatchingDataService } from './data/user-matching-data.service';
import { ContributionCatalogService } from './data/contribution-catalog.service';

import { MatchingEngine } from './engine/matching.engine';

import { ProjectClient } from '../project/project.client';
import { NotificationService } from 'src/notification/notification.service';

describe('MatchingService', () => {
  let service: MatchingService;

  let userMatchingDataService: {
    getByUserId: jest.Mock;
  };

  let contributionCatalogService: {
    getAll: jest.Mock;
  };

  let projectClient: {
    findAll: jest.Mock;
    getMatchingData: jest.Mock;
  };

  let matchingEngine: {
    match: jest.Mock;
  };

  let notificationService: {
    createProjectMatch: jest.Mock;
  };

  const userId = 'user-1';
  const accessToken = 'test-access-token';

  beforeEach(() => {
    userMatchingDataService = {
      getByUserId: jest.fn(),
    };

    contributionCatalogService = {
      getAll: jest.fn(),
    };

    projectClient = {
      findAll: jest.fn(),
      getMatchingData: jest.fn(),
    };

    matchingEngine = {
      match: jest.fn(),
    };

    notificationService = {
      createProjectMatch: jest.fn(),
    };

    service = new MatchingService(
      userMatchingDataService as unknown as UserMatchingDataService,
      contributionCatalogService as unknown as ContributionCatalogService,
      projectClient as unknown as ProjectClient,
      matchingEngine as unknown as MatchingEngine,
      notificationService as unknown as NotificationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMatchedProjects', () => {
    it('should return matched projects sorted by score descending', async () => {
      userMatchingDataService.getByUserId.mockResolvedValue({
        userId,
        categoryIds: ['cat-1'],
        audienceTypeIds: ['aud-1'],
        contributions: [
          {
            id: 'uc-1',
            contributionId: 'con-1',
            name: 'React',
          },
        ],
        experiences: [],
      });

      contributionCatalogService.getAll.mockResolvedValue([
        {
          id: 'con-1',
          name: 'React',
          fieldId: 'field-1',
        },
      ]);

      projectClient.findAll.mockResolvedValue([
        {
          id: 'project-1',
          name: 'Project One',
          description: 'Description one',
          scope: 'NATIONAL',
          stage: 'IDEA',
          activityStatus: 'IN_PROGRESS',
          createdAt: '2026-09-15T10:00:00',
          investmentGoal: null,
          categories: [],
          owner: {
            id: 'user-2',
            name: 'User Two',
          },
        },
        {
          id: 'project-2',
          name: 'Project Two',
          description: 'Description two',
          scope: 'LOCAL',
          stage: 'MVP',
          activityStatus: 'IN_PROGRESS',
          createdAt: '2026-09-14T10:00:00',
          investmentGoal: '100000',
          categories: [],
          owner: {
            id: 'user-3',
            name: 'User Three',
          },
        },
      ]);

      projectClient.getMatchingData.mockResolvedValue([
        {
          id: 'project-1',
          categories: [
            {
              id: 'cat-1',
            },
          ],
          audiences: [],
          humanRequirements: [],
        },
        {
          id: 'project-2',
          categories: [],
          audiences: [],
          humanRequirements: [],
        },
      ]);

      matchingEngine.match
        .mockReturnValueOnce({
          score: 70,
          matchLevel: 'GOOD',
          categoryScore: 100,
          audienceScore: null,
          requirementScore: null,
        })
        .mockReturnValueOnce({
          score: 90,
          matchLevel: 'EXCELLENT',
          categoryScore: null,
          audienceScore: null,
          requirementScore: 100,
        });

      const result = await service.getMatchedProjects(userId, accessToken);

      expect(result).toEqual([
        {
          projectId: 'project-2',
          name: 'Project Two',
          description: 'Description two',
          scope: 'LOCAL',
          stage: 'MVP',
          activityStatus: 'IN_PROGRESS',
          createdAt: '2026-09-14T10:00:00',
          investmentGoal: '100000',
          owner: {
            id: 'user-3',
            name: 'User Three',
          },
          matchLevel: 'EXCELLENT',
          score: 90,
        },
        {
          projectId: 'project-1',
          name: 'Project One',
          description: 'Description one',
          scope: 'NATIONAL',
          stage: 'IDEA',
          activityStatus: 'IN_PROGRESS',
          createdAt: '2026-09-15T10:00:00',
          investmentGoal: null,
          owner: {
            id: 'user-2',
            name: 'User Two',
          },
          matchLevel: 'GOOD',
          score: 70,
        },
      ]);
    });

    it('should exclude projects owned by the current user', async () => {
      const userMatchingData = {
        userId,
        categoryIds: [],
        audienceTypeIds: [],
        contributions: [],
        experiences: [],
      };

      userMatchingDataService.getByUserId.mockResolvedValue(userMatchingData);

      contributionCatalogService.getAll.mockResolvedValue([]);

      projectClient.findAll.mockResolvedValue([
        {
          id: 'my-project',
          name: 'My Project',
          description: null,
          scope: 'NATIONAL',
          stage: 'IDEA',
          activityStatus: 'IN_PROGRESS',
          createdAt: '2026-09-15T10:00:00',
          investmentGoal: null,
          categories: [],
          owner: {
            id: userId,
            name: 'Me',
          },
        },
        {
          id: 'other-project',
          name: 'Other Project',
          description: null,
          scope: 'LOCAL',
          stage: 'MVP',
          activityStatus: 'IN_PROGRESS',
          createdAt: '2026-09-14T10:00:00',
          investmentGoal: null,
          categories: [],
          owner: {
            id: 'user-2',
            name: 'User Two',
          },
        },
      ]);

      projectClient.getMatchingData.mockResolvedValue([
        {
          id: 'other-project',
          categories: [],
          audiences: [],
          humanRequirements: [],
        },
      ]);

      matchingEngine.match.mockReturnValue({
        score: 80,
        matchLevel: 'STRONG',
        categoryScore: null,
        audienceScore: null,
        requirementScore: null,
      });

      const result = await service.getMatchedProjects(userId, accessToken);

      expect(result).toHaveLength(1);

      expect(result[0].projectId).toBe('other-project');

      expect(projectClient.getMatchingData).toHaveBeenCalledWith(
        ['other-project'],
        accessToken,
      );

      expect(matchingEngine.match).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when there are no candidate projects', async () => {
      userMatchingDataService.getByUserId.mockResolvedValue({
        userId,
        categoryIds: [],
        audienceTypeIds: [],
        contributions: [],
        experiences: [],
      });

      contributionCatalogService.getAll.mockResolvedValue([]);

      projectClient.findAll.mockResolvedValue([
        {
          id: 'my-project',
          name: 'My Project',
          description: null,
          scope: 'NATIONAL',
          stage: 'IDEA',
          activityStatus: 'IN_PROGRESS',
          createdAt: '2026-09-15T10:00:00',
          investmentGoal: null,
          categories: [],
          owner: {
            id: userId,
            name: 'Me',
          },
        },
      ]);

      const result = await service.getMatchedProjects(userId, accessToken);

      expect(result).toEqual([]);

      expect(projectClient.getMatchingData).not.toHaveBeenCalled();

      expect(matchingEngine.match).not.toHaveBeenCalled();
    });

    it('should skip projects that have no matching data', async () => {
      userMatchingDataService.getByUserId.mockResolvedValue({
        userId,
        categoryIds: [],
        audienceTypeIds: [],
        contributions: [],
        experiences: [],
      });

      contributionCatalogService.getAll.mockResolvedValue([]);

      projectClient.findAll.mockResolvedValue([
        {
          id: 'project-1',
          name: 'Project One',
          description: null,
          scope: 'NATIONAL',
          stage: 'IDEA',
          activityStatus: 'IN_PROGRESS',
          createdAt: '2026-09-15T10:00:00',
          investmentGoal: null,
          categories: [],
          owner: {
            id: 'user-2',
            name: 'User Two',
          },
        },
        {
          id: 'project-2',
          name: 'Project Two',
          description: null,
          scope: 'LOCAL',
          stage: 'MVP',
          activityStatus: 'IN_PROGRESS',
          createdAt: '2026-09-14T10:00:00',
          investmentGoal: null,
          categories: [],
          owner: {
            id: 'user-3',
            name: 'User Three',
          },
        },
      ]);

      projectClient.getMatchingData.mockResolvedValue([
        {
          id: 'project-1',
          categories: [],
          audiences: [],
          humanRequirements: [],
        },
      ]);

      matchingEngine.match.mockReturnValue({
        score: 80,
        matchLevel: 'STRONG',
        categoryScore: null,
        audienceScore: null,
        requirementScore: null,
      });

      const result = await service.getMatchedProjects(userId, accessToken);

      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('project-1');

      expect(matchingEngine.match).toHaveBeenCalledTimes(1);
    });

    it('should skip projects when matching score is null', async () => {
      userMatchingDataService.getByUserId.mockResolvedValue({
        userId,
        categoryIds: [],
        audienceTypeIds: [],
        contributions: [],
        experiences: [],
      });

      contributionCatalogService.getAll.mockResolvedValue([]);

      projectClient.findAll.mockResolvedValue([
        {
          id: 'project-1',
          name: 'Project One',
          description: null,
          scope: 'NATIONAL',
          stage: 'IDEA',
          activityStatus: 'IN_PROGRESS',
          createdAt: '2026-09-15T10:00:00',
          investmentGoal: null,
          categories: [],
          owner: {
            id: 'user-2',
            name: 'User Two',
          },
        },
      ]);

      projectClient.getMatchingData.mockResolvedValue([
        {
          id: 'project-1',
          categories: [],
          audiences: [],
          humanRequirements: [],
        },
      ]);

      matchingEngine.match.mockReturnValue({
        score: null,
        matchLevel: null,
        categoryScore: null,
        audienceScore: null,
        requirementScore: null,
      });

      const result = await service.getMatchedProjects(userId, accessToken);

      expect(result).toEqual([]);
    });

    it('should pass matching data correctly to MatchingEngine', async () => {
      const userMatchingData = {
        userId,
        categoryIds: ['cat-1'],
        audienceTypeIds: ['aud-1'],
        contributions: [
          {
            id: 'uc-1',
            contributionId: 'con-1',
            name: 'React',
          },
        ],
        experiences: [],
      };

      const catalog = [
        {
          id: 'con-1',
          name: 'React',
          fieldId: 'field-1',
        },
      ];

      const project = {
        id: 'project-1',
        name: 'Project One',
        description: null,
        scope: 'NATIONAL',
        stage: 'IDEA',
        activityStatus: 'IN_PROGRESS',
        createdAt: '2026-09-15T10:00:00',
        investmentGoal: null,
        categories: [],
        owner: {
          id: 'user-2',
          name: 'User Two',
        },
      };

      const matchingData = {
        id: 'project-1',
        categories: [
          {
            id: 'cat-1',
          },
        ],
        audiences: [
          {
            id: 'aud-1',
          },
        ],
        humanRequirements: [
          {
            id: 'requirement-1',
            criteria: [
              {
                status: 'YES' as const,
                term: 'React',
              },
            ],
          },
        ],
      };

      userMatchingDataService.getByUserId.mockResolvedValue(userMatchingData);

      contributionCatalogService.getAll.mockResolvedValue(catalog);

      projectClient.findAll.mockResolvedValue([project]);

      projectClient.getMatchingData.mockResolvedValue([matchingData]);

      matchingEngine.match.mockReturnValue({
        score: 95,
        matchLevel: 'EXCELLENT',
        categoryScore: 100,
        audienceScore: 100,
        requirementScore: 100,
      });

      await service.getMatchedProjects(userId, accessToken);

      expect(matchingEngine.match).toHaveBeenCalledWith(
        userMatchingData,
        {
          projectId: 'project-1',
          categoryIds: ['cat-1'],
          audienceTypeIds: ['aud-1'],
          humanRequirements: matchingData.humanRequirements,
        },
        catalog,
      );
    });

    it('should not expose human criteria in response', async () => {
      userMatchingDataService.getByUserId.mockResolvedValue({
        userId,
        categoryIds: [],
        audienceTypeIds: [],
        contributions: [],
        experiences: [],
      });

      contributionCatalogService.getAll.mockResolvedValue([]);

      projectClient.findAll.mockResolvedValue([
        {
          id: 'project-1',
          name: 'Secret Project',
          description: 'Public description',
          scope: 'NATIONAL',
          stage: 'IDEA',
          activityStatus: 'IN_PROGRESS',
          createdAt: '2026-09-15T10:00:00',
          investmentGoal: null,
          categories: [],
          owner: {
            id: 'user-2',
            name: 'User Two',
          },
        },
      ]);

      projectClient.getMatchingData.mockResolvedValue([
        {
          id: 'project-1',
          categories: [],
          audiences: [],
          humanRequirements: [
            {
              id: 'requirement-1',
              criteria: [
                {
                  status: 'YES',
                  term: 'secret internal skill',
                },
              ],
            },
          ],
        },
      ]);

      matchingEngine.match.mockReturnValue({
        score: 90,
        matchLevel: 'EXCELLENT',
        categoryScore: null,
        audienceScore: null,
        requirementScore: 100,
      });

      const result = await service.getMatchedProjects(userId, accessToken);

      expect(result[0]).not.toHaveProperty('humanRequirements');

      expect(result[0]).not.toHaveProperty('criteria');

      expect(result[0]).not.toHaveProperty('term');
    });

    it('should create project match notifications for matched projects', async () => {
      userMatchingDataService.getByUserId.mockResolvedValue({
        userId,
        categoryIds: [],
        audienceTypeIds: [],
        contributions: [],
        experiences: [],
      });

      contributionCatalogService.getAll.mockResolvedValue([]);

      projectClient.findAll.mockResolvedValue([
        {
          id: 'project-1',
          name: 'Green Education',
          description: 'Education project',
          scope: 'NATIONAL',
          stage: 'MVP',
          activityStatus: 'IN_PROGRESS',
          createdAt: '2026-09-15T10:00:00',
          investmentGoal: null,
          categories: [],
          owner: {
            id: 'user-2',
            name: 'User Two',
          },
        },
      ]);

      projectClient.getMatchingData.mockResolvedValue([
        {
          id: 'project-1',
          categories: [],
          audiences: [],
          humanRequirements: [],
        },
      ]);

      matchingEngine.match.mockReturnValue({
        score: 85,
        matchLevel: 'STRONG',
        categoryScore: null,
        audienceScore: null,
        requirementScore: null,
      });

      notificationService.createProjectMatch.mockResolvedValue({
        id: 'notification-1',
        type: 'PROJECT_MATCH',
        title: 'New project match',
        message: '"Green Education" may be a good match for you.',
        projectId: 'project-1',
        isRead: false,
        createdAt: new Date(),
        readAt: null,
      });

      await service.getMatchedProjects(userId, accessToken);

      expect(notificationService.createProjectMatch).toHaveBeenCalledWith({
        userId,
        projectId: 'project-1',
        projectName: 'Green Education',
        matchLevel: 'STRONG',
      });
    });

    it('should still return matched projects when notification creation fails', async () => {
      userMatchingDataService.getByUserId.mockResolvedValue({
        userId,
        categoryIds: [],
        audienceTypeIds: [],
        contributions: [],
        experiences: [],
      });

      contributionCatalogService.getAll.mockResolvedValue([]);

      projectClient.findAll.mockResolvedValue([
        {
          id: 'project-1',
          name: 'Green Education',
          description: null,
          scope: 'NATIONAL',
          stage: 'MVP',
          activityStatus: 'IN_PROGRESS',
          createdAt: '2026-09-15T10:00:00',
          investmentGoal: null,
          categories: [],
          owner: {
            id: 'user-2',
            name: 'User Two',
          },
        },
      ]);

      projectClient.getMatchingData.mockResolvedValue([
        {
          id: 'project-1',
          categories: [],
          audiences: [],
          humanRequirements: [],
        },
      ]);

      matchingEngine.match.mockReturnValue({
        score: 85,
        matchLevel: 'STRONG',
        categoryScore: null,
        audienceScore: null,
        requirementScore: null,
      });

      notificationService.createProjectMatch.mockRejectedValue(
        new Error('Notification database error'),
      );

      const result = await service.getMatchedProjects(userId, accessToken);

      expect(result).toHaveLength(1);

      expect(result[0]).toMatchObject({
        projectId: 'project-1',
        name: 'Green Education',
        matchLevel: 'STRONG',
        score: 85,
      });
    });
  });
});
