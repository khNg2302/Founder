import { Module } from '@nestjs/common';

import { UserMatchingDataService } from './data/user-matching-data.service';
import { CategoryMatcher } from './engine/category.matcher';
import { AudienceMatcher } from './engine/audience.matcher';
import { ContributionCatalogService } from './data/contribution-catalog.service';
import { RequirementMatcher } from './engine/requirement.matcher';
import { MatchingEngine } from './engine/matching.engine';

@Module({
  providers: [
    UserMatchingDataService,
    ContributionCatalogService,
    CategoryMatcher,
    AudienceMatcher,
    RequirementMatcher,
    MatchingEngine,
  ],
  exports: [
    UserMatchingDataService,
    ContributionCatalogService,
    CategoryMatcher,
    AudienceMatcher,
    RequirementMatcher,
    MatchingEngine,
  ],
})
export class MatchingModule {}
