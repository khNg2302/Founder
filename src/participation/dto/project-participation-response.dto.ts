import {
  ParticipationIntent,
  ParticipationRole,
  ParticipationStatus,
} from 'generated/prisma/enums';

export class ProjectParticipationResponseDto {
  id: string;

  user: {
    id: string;
    name: string | null;
  };

  intent: ParticipationIntent;
  role: ParticipationRole;
  status: ParticipationStatus;
  createdAt: Date;
  updatedAt: Date;
}
