import { IsEnum } from 'class-validator';
import { ParticipationIntent } from 'generated/prisma/enums';

export class CreateParticipationDto {
  @IsEnum(ParticipationIntent)
  intent: ParticipationIntent;
}
