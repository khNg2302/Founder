import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateContributionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fieldId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
