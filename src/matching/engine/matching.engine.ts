import { Injectable } from '@nestjs/common';

import { UserMatchingData } from '../data/user-matching-data.types';
import { ContributionCatalogItem } from '../data/contribution-catalog.types';

import { CategoryMatcher } from './category.matcher';
import { AudienceMatcher } from './audience.matcher';
import {
  MatchingHumanRequirement,
  RequirementMatcher,
} from './requirement.matcher';

export type MatchLevel = 'EXCELLENT' | 'STRONG' | 'GOOD' | 'MODERATE' | 'LOW';

export interface ProjectMatchingInput {
  projectId: string;
  categoryIds: string[];
  audienceTypeIds: string[];
  humanRequirements: MatchingHumanRequirement[];
}

export interface MatchingScoreComponent {
  score: number | null;
  weight: number;
}

export interface MatchingEngineResult {
  score: number | null;
  matchLevel: MatchLevel | null;

  categoryScore: number | null;
  audienceScore: number | null;
  requirementScore: number | null;
}

@Injectable()
export class MatchingEngine {
  private readonly CATEGORY_WEIGHT = 25;
  private readonly AUDIENCE_WEIGHT = 15;
  private readonly REQUIREMENT_WEIGHT = 60;

  constructor(
    private readonly categoryMatcher: CategoryMatcher,
    private readonly audienceMatcher: AudienceMatcher,
    private readonly requirementMatcher: RequirementMatcher,
  ) {}

  match(
    user: UserMatchingData,
    project: ProjectMatchingInput,
    contributionCatalog: ContributionCatalogItem[],
  ): MatchingEngineResult {
    const categoryResult = this.categoryMatcher.match(
      user.categoryIds,
      project.categoryIds,
    );

    const audienceResult = this.audienceMatcher.match(
      user.audienceTypeIds,
      project.audienceTypeIds,
    );

    const requirementResult = this.requirementMatcher.match(
      project.humanRequirements,
      user.contributions,
      contributionCatalog,
    );

    const score = this.calculateWeightedScore([
      {
        score: categoryResult.score,
        weight: this.CATEGORY_WEIGHT,
      },
      {
        score: audienceResult.score,
        weight: this.AUDIENCE_WEIGHT,
      },
      {
        score: requirementResult?.score ?? null,
        weight: this.REQUIREMENT_WEIGHT,
      },
    ]);

    return {
      score,
      matchLevel: score === null ? null : this.toMatchLevel(score),

      categoryScore: categoryResult.score,
      audienceScore: audienceResult.score,
      requirementScore: requirementResult?.score ?? null,
    };
  }

  private calculateWeightedScore(
    components: MatchingScoreComponent[],
  ): number | null {
    const availableComponents = components.filter(
      (component) => component.score !== null,
    );

    if (availableComponents.length === 0) {
      return null;
    }

    const weightedTotal = availableComponents.reduce(
      (total, component) => total + (component.score ?? 0) * component.weight,
      0,
    );

    const totalWeight = availableComponents.reduce(
      (total, component) => total + component.weight,
      0,
    );

    return weightedTotal / totalWeight;
  }

  private toMatchLevel(score: number): MatchLevel {
    if (score >= 90) {
      return 'EXCELLENT';
    }

    if (score >= 75) {
      return 'STRONG';
    }

    if (score >= 60) {
      return 'GOOD';
    }

    if (score >= 40) {
      return 'MODERATE';
    }

    return 'LOW';
  }
}
