import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateContributionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fieldId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(500)
  description?: string;
}
