import { Module } from '@nestjs/common';

import { UserMatchingDataService } from './data/user-matching-data.service';
import { CategoryMatcher } from './engine/category.matcher';
import { AudienceMatcher } from './engine/audience.matcher';
import { ContributionCatalogService } from './data/contribution-catalog.service';

@Module({
  providers: [
    UserMatchingDataService,
    ContributionCatalogService,
    CategoryMatcher,
    AudienceMatcher,
  ],
  exports: [
    UserMatchingDataService,
    ContributionCatalogService,
    CategoryMatcher,
    AudienceMatcher,
  ],
})
export class MatchingModule {}
