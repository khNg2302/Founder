import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

@Controller('assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Get()
  findAll() {
    return this.assessmentService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.assessmentService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateAssessmentDto) {
    return this.assessmentService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAssessmentDto) {
    return this.assessmentService.update(id, dto);
  }
}
