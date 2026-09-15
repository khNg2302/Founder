import { NotFoundException } from '@nestjs/common';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  const prisma = {
    notification: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new NotificationService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProjectMatch', () => {
    it('should create a project match notification', async () => {
      const notification = {
        id: 'notification-1',
        type: 'PROJECT_MATCH' as const,
        title: 'New project match',
        message: '"Green Education" may be a good match for you.',
        projectId: 'project-1',
        isRead: false,
        createdAt: new Date('2026-09-15T10:00:00Z'),
        readAt: null,
      };

      prisma.notification.upsert.mockResolvedValue(notification);

      const result = await service.createProjectMatch({
        userId: 'user-1',
        projectId: 'project-1',
        projectName: 'Green Education',
        matchLevel: 'STRONG',
      });

      expect(prisma.notification.upsert).toHaveBeenCalledWith({
        where: {
          userId_type_projectId: {
            userId: 'user-1',
            type: 'PROJECT_MATCH',
            projectId: 'project-1',
          },
        },
        create: {
          userId: 'user-1',
          type: 'PROJECT_MATCH',
          title: 'New project match',
          message: '"Green Education" may be a good match for you.',
          projectId: 'project-1',
          isRead: false,
        },
        update: {},
      });

      expect(result).toEqual(notification);
    });

    it('should be idempotent when notification already exists', async () => {
      const existingNotification = {
        id: 'notification-1',
        type: 'PROJECT_MATCH' as const,
        title: 'New project match',
        message: '"Green Education" may be a good match for you.',
        projectId: 'project-1',
        isRead: true,
        createdAt: new Date('2026-09-15T10:00:00Z'),
        readAt: new Date('2026-09-15T11:00:00Z'),
      };

      prisma.notification.upsert.mockResolvedValue(existingNotification);

      const result = await service.createProjectMatch({
        userId: 'user-1',
        projectId: 'project-1',
        projectName: 'Green Education',
        matchLevel: 'STRONG',
      });

      expect(result).toEqual(existingNotification);

      expect(prisma.notification.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMyNotifications', () => {
    it('should return notifications ordered by newest first', async () => {
      const notifications = [
        {
          id: 'notification-2',
          type: 'PROJECT_MATCH' as const,
          title: 'New project match',
          message: '"Project Two" may be a good match for you.',
          projectId: 'project-2',
          isRead: false,
          createdAt: new Date('2026-09-15T12:00:00Z'),
          readAt: null,
        },
        {
          id: 'notification-1',
          type: 'PROJECT_MATCH' as const,
          title: 'New project match',
          message: '"Project One" may be a good match for you.',
          projectId: 'project-1',
          isRead: true,
          createdAt: new Date('2026-09-15T10:00:00Z'),
          readAt: new Date('2026-09-15T11:00:00Z'),
        },
      ];

      prisma.notification.findMany.mockResolvedValue(notifications);

      const result = await service.getMyNotifications('user-1');

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toEqual(notifications);
    });

    it('should return empty array when user has no notifications', async () => {
      prisma.notification.findMany.mockResolvedValue([]);

      const result = await service.getMyNotifications('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      prisma.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-1');

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRead: false,
        },
      });

      expect(result).toBe(3);
    });

    it('should return zero when there are no unread notifications', async () => {
      prisma.notification.count.mockResolvedValue(0);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = {
        id: 'notification-1',
        type: 'PROJECT_MATCH' as const,
        title: 'New project match',
        message: '"Project One" may be a good match for you.',
        projectId: 'project-1',
        isRead: false,
        createdAt: new Date('2026-09-15T10:00:00Z'),
        readAt: null,
      };

      const updatedNotification = {
        ...notification,
        isRead: true,
        readAt: new Date('2026-09-15T11:00:00Z'),
      };

      prisma.notification.findFirst.mockResolvedValue(notification);

      prisma.notification.update.mockResolvedValue(updatedNotification);

      const result = await service.markAsRead('user-1', 'notification-1');

      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'notification-1',
          userId: 'user-1',
        },
      });

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: {
          id: 'notification-1',
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });

      expect(result).toEqual(updatedNotification);
    });

    it('should return existing notification when already read', async () => {
      const notification = {
        id: 'notification-1',
        type: 'PROJECT_MATCH' as const,
        title: 'New project match',
        message: '"Project One" may be a good match for you.',
        projectId: 'project-1',
        isRead: true,
        createdAt: new Date('2026-09-15T10:00:00Z'),
        readAt: new Date('2026-09-15T11:00:00Z'),
      };

      prisma.notification.findFirst.mockResolvedValue(notification);

      const result = await service.markAsRead('user-1', 'notification-1');

      expect(result).toEqual(notification);

      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when notification does not belong to user', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(
        service.markAsRead('user-1', 'notification-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({
        count: 3,
      });

      await service.markAllAsRead('user-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });

    it('should still succeed when there are no unread notifications', async () => {
      prisma.notification.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(service.markAllAsRead('user-1')).resolves.toBeUndefined();
    });
  });
});
