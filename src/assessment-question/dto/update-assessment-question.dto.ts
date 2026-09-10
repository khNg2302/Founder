import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssessmentQuestionType } from 'generated/prisma/enums';

export class UpdateAssessmentOptionDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  order: number;

  @IsBoolean()
  isCorrect: boolean;
}

export class UpdateAssessmentQuestionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @IsOptional()
  @IsEnum(AssessmentQuestionType)
  type?: AssessmentQuestionType;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => UpdateAssessmentOptionDto)
  options?: UpdateAssessmentOptionDto[];
}
