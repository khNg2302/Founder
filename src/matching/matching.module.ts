import { Module } from '@nestjs/common';

import { UserMatchingDataService } from './data/user-matching-data.service';
import { CategoryMatcher } from './engine/category.matcher';
import { AudienceMatcher } from './engine/audience.matcher';

@Module({
  providers: [UserMatchingDataService, CategoryMatcher, AudienceMatcher],
  exports: [UserMatchingDataService, CategoryMatcher, AudienceMatcher],
})
export class MatchingModule {}
