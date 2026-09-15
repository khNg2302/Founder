import { Injectable } from '@nestjs/common';

import { UserMatchingContribution } from '../data/user-matching-data.types';

import { ContributionCatalogItem } from '../data/contribution-catalog.types';

export type RequirementCriterionResult = 'MATCH' | 'NOT_MATCH' | 'UNKNOWN';

export interface MatchingHumanCriterion {
  status: 'YES' | 'NO';
  term: string;
}

export interface MatchingHumanRequirement {
  id: string;
  criteria: MatchingHumanCriterion[];
}

export interface RequirementCriterionMatch {
  status: 'YES' | 'NO';
  term: string;
  result: RequirementCriterionResult;
}

export interface RequirementMatchResult {
  requirementId: string;
  score: number | null;
  matchedCount: number;
  evaluableCount: number;
  criteria: RequirementCriterionMatch[];
}

@Injectable()
export class RequirementMatcher {
  matchRequirement(
    requirement: MatchingHumanRequirement,
    userContributions: UserMatchingContribution[],
    contributionCatalog: ContributionCatalogItem[],
  ): RequirementMatchResult {
    const userTerms = new Set(
      userContributions.map((contribution) =>
        this.normalize(contribution.name),
      ),
    );

    const catalogTerms = new Set(
      contributionCatalog.map((contribution) =>
        this.normalize(contribution.name),
      ),
    );

    let matchedCount = 0;
    let evaluableCount = 0;

    const criteria: RequirementCriterionMatch[] = [];

    for (const criterion of requirement.criteria) {
      const term = this.normalize(criterion.term);

      if (!term) {
        criteria.push({
          status: criterion.status,
          term: criterion.term,
          result: 'UNKNOWN',
        });

        continue;
      }

      const isKnownTerm = catalogTerms.has(term);

      if (!isKnownTerm) {
        criteria.push({
          status: criterion.status,
          term: criterion.term,
          result: 'UNKNOWN',
        });

        continue;
      }

      const userHasTerm = userTerms.has(term);

      let result: RequirementCriterionResult;

      if (criterion.status === 'YES') {
        result = userHasTerm ? 'MATCH' : 'NOT_MATCH';
      } else {
        result = userHasTerm ? 'NOT_MATCH' : 'MATCH';
      }

      evaluableCount++;

      if (result === 'MATCH') {
        matchedCount++;
      }

      criteria.push({
        status: criterion.status,
        term: criterion.term,
        result,
      });
    }

    const score =
      evaluableCount === 0 ? null : (matchedCount / evaluableCount) * 100;

    return {
      requirementId: requirement.id,
      score,
      matchedCount,
      evaluableCount,
      criteria,
    };
  }

  match(
    requirements: MatchingHumanRequirement[],
    userContributions: UserMatchingContribution[],
    contributionCatalog: ContributionCatalogItem[],
  ): RequirementMatchResult | null {
    const results = requirements
      .map((requirement) =>
        this.matchRequirement(
          requirement,
          userContributions,
          contributionCatalog,
        ),
      )
      .filter((result) => result.score !== null);

    if (results.length === 0) {
      return null;
    }

    return results.reduce((best, current) =>
      (current.score ?? -1) > (best.score ?? -1) ? current : best,
    );
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }
}
