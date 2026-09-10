import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { CategoryResponse } from './types/category-response';

@Injectable()
export class CategoryClient {
  private readonly baseUrl =
    process.env.SPRING_API_URL ?? 'http://localhost:8081';

  async findById(id: string, accessToken: string): Promise<CategoryResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/categories/${encodeURIComponent(id)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.status === 404) {
        throw new NotFoundException(`Category '${id}' not found`);
      }

      if (response.status === 401) {
        throw new UnauthorizedException(
          'Category service rejected the access token',
        );
      }

      if (response.status === 403) {
        throw new ForbiddenException('Access denied by category service');
      }

      if (!response.ok) {
        throw new ServiceUnavailableException(
          'Category service is unavailable',
        );
      }

      return (await response.json()) as CategoryResponse;
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
        'Unable to connect to category service',
      );
    }
  }

  async findByIds(
    ids: string[],
    accessToken: string,
  ): Promise<CategoryResponse[]> {
    return Promise.all(ids.map((id) => this.findById(id, accessToken)));
  }
}
