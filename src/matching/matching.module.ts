import { Module } from '@nestjs/common';

import { ProjectClient } from '../project/project.client';

import { UserMatchingDataService } from './data/user-matching-data.service';

import { ContributionCatalogService } from './data/contribution-catalog.service';

import { CategoryMatcher } from './engine/category.matcher';

import { AudienceMatcher } from './engine/audience.matcher';

import { RequirementMatcher } from './engine/requirement.matcher';

import { MatchingEngine } from './engine/matching.engine';

import { MatchingService } from './matching.service';

@Module({
  providers: [
    ProjectClient,

    UserMatchingDataService,
    ContributionCatalogService,

    CategoryMatcher,
    AudienceMatcher,
    RequirementMatcher,
    MatchingEngine,

    MatchingService,
  ],
  exports: [MatchingService],
})
export class MatchingModule {}
