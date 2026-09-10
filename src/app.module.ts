import { Module } from '@nestjs/common';

import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { AccountModule } from './account/account.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ContributionModule } from './contribution/contribution.module';
import { ExperienceModule } from './experience/experience.module';
import { AssessmentModule } from './assessment/assessment.module';
import { AssessmentQuestionModule } from './assessment-question/assessment-question.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AccountModule,
    UserModule,
    AuthModule,
    AdminModule,
    ContributionModule,
    ExperienceModule,
    AssessmentModule,
    AssessmentQuestionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
