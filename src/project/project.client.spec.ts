import {
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { ProjectClient } from './project.client';

describe('ProjectClient', () => {
  let client: ProjectClient;

  const accessToken = 'test-access-token';

  const originalFetch = global.fetch;

  beforeEach(() => {
    client = new ProjectClient();

    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('findById', () => {
    it('should return project when request succeeds', async () => {
      const project = {
        id: 'project-1',
        name: 'Project One',
        owner: {
          id: 'user-1',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(project),
      });

      const result = await client.findById('project-1', accessToken);

      expect(result).toEqual(project);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8081/projects/project-1',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    });

    it('should throw NotFoundException when project does not exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(
        client.findById('project-404', accessToken),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw UnauthorizedException when Spring rejects token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(
        client.findById('project-1', accessToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw ForbiddenException when access is denied', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
      });

      await expect(
        client.findById('project-1', accessToken),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw ServiceUnavailableException for other HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        client.findById('project-1', accessToken),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        client.findById('project-1', accessToken),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('should encode project id in URL', async () => {
      const project = {
        id: 'project/1',
        name: 'Project One',
        owner: {
          id: 'user-1',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(project),
      });

      await client.findById('project/1', accessToken);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8081/projects/project%2F1',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    });
  });

  describe('findAll', () => {
    it('should return projects from a single page', async () => {
      const response = {
        content: [
          {
            id: 'project-1',
            name: 'Project One',
            description: 'Description',
            scope: 'NATIONAL',
            stage: 'IDEA',
            activityStatus: 'IN_PROGRESS',
            createdAt: '2026-09-15T10:00:00',
            investmentGoal: null,
            categories: [
              {
                id: 'cat-1',
                name: 'Technology',
              },
            ],
            owner: {
              id: 'user-1',
              name: 'User One',
            },
          },
        ],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(response),
      });

      const result = await client.findAll(accessToken);

      expect(result).toEqual(response.content);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8081/projects?page=0&size=100',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    });

    it('should load all pages', async () => {
      const page0 = {
        content: [
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
              id: 'user-1',
              name: 'User One',
            },
          },
        ],
        page: 0,
        size: 100,
        totalElements: 2,
        totalPages: 2,
      };

      const page1 = {
        content: [
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
              id: 'user-2',
              name: 'User Two',
            },
          },
        ],
        page: 1,
        size: 100,
        totalElements: 2,
        totalPages: 2,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue(page0),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue(page1),
        });

      const result = await client.findAll(accessToken);

      expect(result).toEqual([...page0.content, ...page1.content]);

      expect(global.fetch).toHaveBeenCalledTimes(2);

      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        'http://localhost:8081/projects?page=0&size=100',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'http://localhost:8081/projects?page=1&size=100',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    });

    it('should return empty array when there are no projects', async () => {
      const response = {
        content: [],
        page: 0,
        size: 100,
        totalElements: 0,
        totalPages: 0,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(response),
      });

      const result = await client.findAll(accessToken);

      expect(result).toEqual([]);

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when Spring rejects token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(client.findAll(accessToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException when access is denied', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
      });

      await expect(client.findAll(accessToken)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('should throw ServiceUnavailableException for other HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
      });

      await expect(client.findAll(accessToken)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(client.findAll(accessToken)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });

  describe('getMatchingData', () => {
    it('should return empty array without calling Spring when projectIds is empty', async () => {
      const result = await client.getMatchingData([], accessToken);

      expect(result).toEqual([]);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return matching data for project ids', async () => {
      const response = {
        projects: [
          {
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
                id: 'req-1',
                criteria: [
                  {
                    status: 'YES',
                    term: 'React',
                  },
                  {
                    status: 'NO',
                    term: 'PHP',
                  },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(response),
      });

      const result = await client.getMatchingData(['project-1'], accessToken);

      expect(result).toEqual(response.projects);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8081/projects/matching-data?ids=project-1',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    });

    it('should send multiple project ids', async () => {
      const response = {
        projects: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(response),
      });

      await client.getMatchingData(
        ['project-1', 'project-2', 'project-3'],
        accessToken,
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8081/projects/matching-data?ids=project-1%2Cproject-2%2Cproject-3',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    });

    it('should throw UnauthorizedException when Spring rejects token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(
        client.getMatchingData(['project-1'], accessToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw ForbiddenException when access is denied', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
      });

      await expect(
        client.getMatchingData(['project-1'], accessToken),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw ServiceUnavailableException for other HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        client.getMatchingData(['project-1'], accessToken),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        client.getMatchingData(['project-1'], accessToken),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });
});
