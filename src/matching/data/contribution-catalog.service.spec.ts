import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'prisma/prisma.service';

import { ContributionCatalogService } from './contribution-catalog.service';

describe('ContributionCatalogService', () => {
  let service: ContributionCatalogService;

  const prismaMock = {
    contribution: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContributionCatalogService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ContributionCatalogService>(
      ContributionCatalogService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all contributions', async () => {
    prismaMock.contribution.findMany.mockResolvedValue([
      {
        id: 'contribution-1',
        name: 'React',
        fieldId: 'field-frontend',
      },
      {
        id: 'contribution-2',
        name: 'TypeScript',
        fieldId: 'field-frontend',
      },
    ]);

    const result = await service.getAll();

    expect(result).toEqual([
      {
        id: 'contribution-1',
        name: 'React',
        fieldId: 'field-frontend',
      },
      {
        id: 'contribution-2',
        name: 'TypeScript',
        fieldId: 'field-frontend',
      },
    ]);

    expect(prismaMock.contribution.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        fieldId: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  });

  it('should return empty array when no contributions exist', async () => {
    prismaMock.contribution.findMany.mockResolvedValue([]);

    const result = await service.getAll();

    expect(result).toEqual([]);
  });
});
