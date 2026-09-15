import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProjectActivityStatus } from 'generated/prisma/enums';

export interface ProjectResponse {
  id: string;
  owner: {
    id: string;
  };
  name: string;
  activityStatus: ProjectActivityStatus;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description?: string | null;
  scope: string;
  stage: string;
  activityStatus: string;
  createdAt: string;
  investmentGoal?: string | null;
  categories: {
    id: string;
    name: string;
  }[];
  owner: {
    id: string;
    name?: string | null;
  };
}

export interface ProjectPageResponse {
  content: ProjectListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ProjectMatchingData {
  id: string;
  categories: {
    id: string;
  }[];
  audiences: {
    id: string;
  }[];
  humanRequirements: {
    id: string;
    criteria: {
      status: 'YES' | 'NO';
      term: string;
    }[];
  }[];
}

export interface ProjectMatchingDataListResponse {
  projects: ProjectMatchingData[];
}

@Injectable()
export class ProjectClient {
  private readonly baseUrl =
    process.env.SPRING_API_URL ?? 'http://localhost:8081';

  async findById(id: string, accessToken: string): Promise<ProjectResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/projects/${encodeURIComponent(id)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.status === 404) {
        throw new NotFoundException(`Project '${id}' not found`);
      }

      if (response.status === 401) {
        throw new UnauthorizedException(
          'Project service rejected the access token',
        );
      }

      if (response.status === 403) {
        throw new ForbiddenException('Access denied by project service');
      }

      if (!response.ok) {
        throw new ServiceUnavailableException('Project service is unavailable');
      }

      return (await response.json()) as ProjectResponse;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'Unable to connect to project service',
      );
    }
  }

  async findAll(accessToken: string): Promise<ProjectListItem[]> {
    try {
      const projects: ProjectListItem[] = [];

      let page = 0;
      let totalPages = 1;

      while (page < totalPages) {
        const url = new URL(`${this.baseUrl}/projects`);

        url.searchParams.set('page', String(page));

        url.searchParams.set('size', '100');

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401) {
          throw new UnauthorizedException(
            'Project service rejected the access token',
          );
        }

        if (response.status === 403) {
          throw new ForbiddenException('Access denied by project service');
        }

        if (!response.ok) {
          throw new ServiceUnavailableException(
            'Project service is unavailable',
          );
        }

        const data = (await response.json()) as ProjectPageResponse;

        projects.push(...data.content);

        totalPages = data.totalPages;
        page++;
      }

      return projects;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'Unable to connect to project service',
      );
    }
  }

  async getMatchingData(
    projectIds: string[],
    accessToken: string,
  ): Promise<ProjectMatchingData[]> {
    if (projectIds.length === 0) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        ids: projectIds.join(','),
      });

      const response = await fetch(
        `${this.baseUrl}/projects/matching-data?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.status === 401) {
        throw new UnauthorizedException(
          'Project service rejected the access token',
        );
      }

      if (response.status === 403) {
        throw new ForbiddenException('Access denied by project service');
      }

      if (!response.ok) {
        throw new ServiceUnavailableException('Project service is unavailable');
      }

      const data = (await response.json()) as ProjectMatchingDataListResponse;

      return data.projects;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'Unable to connect to project service',
      );
    }
  }
}
