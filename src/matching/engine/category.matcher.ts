import { Injectable } from '@nestjs/common';

export interface CategoryMatchResult {
  score: number | null;
  matchedCount: number;
  totalCount: number;
}

@Injectable()
export class CategoryMatcher {
  match(
    userCategoryIds: string[],
    projectCategoryIds: string[],
  ): CategoryMatchResult {
    const projectIds = [...new Set(projectCategoryIds)];

    if (projectIds.length === 0) {
      return {
        score: null,
        matchedCount: 0,
        totalCount: 0,
      };
    }

    const userIds = new Set(userCategoryIds);

    const matchedCount = projectIds.filter((categoryId) =>
      userIds.has(categoryId),
    ).length;

    const score = (matchedCount / projectIds.length) * 100;

    return {
      score,
      matchedCount,
      totalCount: projectIds.length,
    };
  }
}
