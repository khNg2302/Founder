import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

export interface ProjectResponse {
  id: string;
  owner: { id: string };
  name: string;
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
}
