import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateAssessmentDto {
  @IsString()
  @IsNotEmpty()
  contributionId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  version: number;

  @IsInt()
  @Min(0)
  @Max(100)
  passingScore: number;
}
