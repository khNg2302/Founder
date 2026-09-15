import { Injectable, NotFoundException } from '@nestjs/common';

import {
  CreateProjectMatchNotificationInput,
  NotificationResponse,
} from './notification.types';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async createProjectMatch(
    input: CreateProjectMatchNotificationInput,
  ): Promise<NotificationResponse> {
    const notification = await this.prisma.notification.upsert({
      where: {
        userId_type_projectId: {
          userId: input.userId,
          type: 'PROJECT_MATCH',
          projectId: input.projectId,
        },
      },

      create: {
        userId: input.userId,
        type: 'PROJECT_MATCH',
        title: 'New project match',
        message: `"${input.projectName}" may be a good match for you.`,
        projectId: input.projectId,
        isRead: false,
      },

      update: {},
    });

    return this.toResponse(notification);
  }

  async getMyNotifications(userId: string): Promise<NotificationResponse[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications.map((notification) => this.toResponse(notification));
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationResponse> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notification '${notificationId}' not found`);
    }

    if (notification.isRead) {
      return this.toResponse(notification);
    }

    const updated = await this.prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.toResponse(updated);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  private toResponse(notification: {
    id: string;
    type: 'PROJECT_MATCH';
    title: string;
    message: string;
    projectId: string | null;
    isRead: boolean;
    createdAt: Date;
    readAt: Date | null;
  }): NotificationResponse {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      projectId: notification.projectId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
    };
  }
}
