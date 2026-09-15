import { Injectable } from '@nestjs/common';

export interface AudienceMatchResult {
  score: number | null;
  matchedCount: number;
  totalCount: number;
}

@Injectable()
export class AudienceMatcher {
  match(
    userAudienceTypeIds: string[],
    projectAudienceTypeIds: string[],
  ): AudienceMatchResult {
    const projectIds = [...new Set(projectAudienceTypeIds)];

    if (projectIds.length === 0) {
      return {
        score: null,
        matchedCount: 0,
        totalCount: 0,
      };
    }

    const userIds = new Set(userAudienceTypeIds);

    const matchedCount = projectIds.filter((audienceTypeId) =>
      userIds.has(audienceTypeId),
    ).length;

    const score = (matchedCount / projectIds.length) * 100;

    return {
      score,
      matchedCount,
      totalCount: projectIds.length,
    };
  }
}
