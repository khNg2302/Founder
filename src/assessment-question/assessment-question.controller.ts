import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { AssessmentQuestionService } from './assessment-question.service';

import { CreateAssessmentQuestionDto } from './dto/create-assessment-question.dto';
import { UpdateAssessmentQuestionDto } from './dto/update-assessment-question.dto';

@Controller('assessments/:assessmentId/questions')
export class AssessmentQuestionController {
  constructor(
    private readonly assessmentQuestionService: AssessmentQuestionService,
  ) {}

  @Get()
  findAll(@Param('assessmentId') assessmentId: string) {
    return this.assessmentQuestionService.findAll(assessmentId);
  }

  @Get(':questionId')
  findById(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.assessmentQuestionService.findById(assessmentId, questionId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('assessmentId') assessmentId: string,
    @Body() dto: CreateAssessmentQuestionDto,
  ) {
    return this.assessmentQuestionService.create(assessmentId, dto);
  }

  @Patch(':questionId')
  update(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateAssessmentQuestionDto,
  ) {
    return this.assessmentQuestionService.update(assessmentId, questionId, dto);
  }

  @Delete(':questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
  ) {
    await this.assessmentQuestionService.delete(assessmentId, questionId);
  }
}
