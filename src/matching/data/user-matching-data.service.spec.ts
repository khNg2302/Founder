import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { UserMatchingDataService } from './user-matching-data.service';
import { PrismaService } from 'prisma/prisma.service';

describe('UserMatchingDataService', () => {
  let service: UserMatchingDataService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserMatchingDataService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UserMatchingDataService>(UserMatchingDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return user matching data', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',

      categories: [
        {
          categoryId: 'category-1',
        },
        {
          categoryId: 'category-2',
        },
      ],

      audiences: [
        {
          audienceTypeId: 'audience-1',
        },
      ],

      contributions: [
        {
          id: 'user-contribution-1',
          contributionId: 'contribution-1',
          contribution: {
            name: 'React',
          },
        },
        {
          id: 'user-contribution-2',
          contributionId: 'contribution-2',
          contribution: {
            name: 'TypeScript',
          },
        },
      ],

      experiences: [
        {
          contributionId: 'contribution-1',
          durationValue: 3,
          durationUnit: 'YEAR',
        },
      ],
    });

    const result = await service.getByUserId('user-1');

    expect(result).toEqual({
      userId: 'user-1',

      categoryIds: ['category-1', 'category-2'],

      audienceTypeIds: ['audience-1'],

      contributions: [
        {
          id: 'user-contribution-1',
          contributionId: 'contribution-1',
          name: 'React',
        },
        {
          id: 'user-contribution-2',
          contributionId: 'contribution-2',
          name: 'TypeScript',
        },
      ],

      experiences: [
        {
          contributionId: 'contribution-1',
          durationValue: 3,
          durationUnit: 'YEAR',
        },
      ],
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
      },

      select: {
        id: true,

        categories: {
          select: {
            categoryId: true,
          },
        },

        audiences: {
          select: {
            audienceTypeId: true,
          },
        },

        contributions: {
          select: {
            id: true,
            contributionId: true,

            contribution: {
              select: {
                name: true,
              },
            },
          },
        },

        experiences: {
          select: {
            contributionId: true,
            durationValue: true,
            durationUnit: true,
          },
        },
      },
    });
  });

  it('should throw NotFoundException when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.getByUserId('user-not-found')).rejects.toThrow(
      new NotFoundException("User 'user-not-found' not found"),
    );
  });

  it('should return empty matching collections when user has no matching data', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',

      categories: [],
      audiences: [],
      contributions: [],
      experiences: [],
    });

    const result = await service.getByUserId('user-1');

    expect(result).toEqual({
      userId: 'user-1',
      categoryIds: [],
      audienceTypeIds: [],
      contributions: [],
      experiences: [],
    });
  });

  it('should keep contribution even when it has no experience', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',

      categories: [],
      audiences: [],

      contributions: [
        {
          id: 'user-contribution-1',
          contributionId: 'contribution-1',
          contribution: {
            name: 'React',
          },
        },
      ],

      experiences: [],
    });

    const result = await service.getByUserId('user-1');

    expect(result.contributions).toEqual([
      {
        id: 'user-contribution-1',
        contributionId: 'contribution-1',
        name: 'React',
      },
    ]);

    expect(result.experiences).toEqual([]);
  });
});
