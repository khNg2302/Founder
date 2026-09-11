import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateCommunityFeedbackDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communication?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  reliability?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  collaboration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  professionalism?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
