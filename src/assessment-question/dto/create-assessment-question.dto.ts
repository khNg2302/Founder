import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssessmentQuestionType } from 'generated/prisma/enums';

export class CreateAssessmentOptionDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  order: number;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateAssessmentQuestionDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(AssessmentQuestionType)
  type: AssessmentQuestionType;

  @IsInt()
  order: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateAssessmentOptionDto)
  options: CreateAssessmentOptionDto[];
}
