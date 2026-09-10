import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { DurationUnit } from 'generated/prisma/enums';

export class UpdateExperienceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  contributionId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationValue?: number;

  @IsOptional()
  @IsEnum(DurationUnit)
  durationUnit?: DurationUnit;
}
