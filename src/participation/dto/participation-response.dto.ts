import {
  ParticipationIntent,
  ParticipationRole,
  ParticipationStatus,
} from 'generated/prisma/enums';

export class ParticipationResponseDto {
  id: string;
  intent: ParticipationIntent;
  role: ParticipationRole;
  status: ParticipationStatus;
  createdAt: Date;
  updatedAt: Date;
}
