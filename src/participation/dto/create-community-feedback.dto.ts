import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCommunityFeedbackDto {
  @IsString()
  reviewedUserId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  communication: number;

  @IsInt()
  @Min(1)
  @Max(5)
  reliability: number;

  @IsInt()
  @Min(1)
  @Max(5)
  collaboration: number;

  @IsInt()
  @Min(1)
  @Max(5)
  professionalism: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
