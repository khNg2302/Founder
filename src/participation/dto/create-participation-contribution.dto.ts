import { IsNotEmpty, IsString } from 'class-validator';

export class CreateParticipationContributionDto {
  @IsString()
  @IsNotEmpty()
  userContributionId: string;
}
