export class CommunityFeedbackResponseDto {
  id: string;
  participationId: string;
  reviewerId: string;
  reviewedUserId: string;

  communication: number;
  reliability: number;
  collaboration: number;
  professionalism: number;

  comment: string | null;

  createdAt: Date;
  updatedAt: Date;
}
