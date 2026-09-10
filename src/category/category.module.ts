import { Module } from '@nestjs/common';

import { CategoryClient } from './category.client';

@Module({
  providers: [CategoryClient],
  exports: [CategoryClient],
})
export class CategoryModule {}
