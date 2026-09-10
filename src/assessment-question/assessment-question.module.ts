import { Module } from '@nestjs/common';

import { AssessmentQuestionController } from './assessment-question.controller';
import { AssessmentQuestionService } from './assessment-question.service';

@Module({
  controllers: [AssessmentQuestionController],
  providers: [AssessmentQuestionService],
  exports: [AssessmentQuestionService],
})
export class AssessmentQuestionModule {}
