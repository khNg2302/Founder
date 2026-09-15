import { Module } from '@nestjs/common';

import { UserMatchingDataService } from './data/user-matching-data.service';

@Module({
  providers: [UserMatchingDataService],
  exports: [UserMatchingDataService],
})
export class MatchingModule {}
