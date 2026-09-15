import { Injectable } from '@nestjs/common';

import { ContributionCatalogItem } from './contribution-catalog.types';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ContributionCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<ContributionCatalogItem[]> {
    const contributions = await this.prisma.contribution.findMany({
      select: {
        id: true,
        name: true,
        fieldId: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return contributions;
  }
}
