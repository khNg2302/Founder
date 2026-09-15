export interface CreateProjectMatchNotificationInput {
  userId: string;
  projectId: string;
  projectName: string;
  matchLevel: string;
}

export interface NotificationResponse {
  id: string;
  type: 'PROJECT_MATCH';
  title: string;
  message: string;
  projectId: string | null;
  isRead: boolean;
  createdAt: Date;
  readAt: Date | null;
}
