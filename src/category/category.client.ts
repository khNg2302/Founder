import {
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

  async findById(id: string, authorization: string): Promise<CategoryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/${id}`, {
        method: 'GET',
        headers: {
          Authorization: authorization,
          Accept: 'application/json',
        },
      });

      if (response.status === 401) {
        throw new UnauthorizedException('Unauthorized');
      }

      if (response.status === 404) {
        throw new NotFoundException(`Category '${id}' not found`);
      }

      if (!response.ok) {
        throw new ServiceUnavailableException(
          'Category service is unavailable',
        );
      }

      return (await response.json()) as CategoryResponse;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
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
    authorization: string,
  ): Promise<CategoryResponse[]> {
    return Promise.all(ids.map((id) => this.findById(id, authorization)));
  }
}
