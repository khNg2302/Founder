import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;

  const notificationService = {
    getMyNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new NotificationController(
      notificationService as unknown as NotificationService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyNotifications', () => {
    it('should return current user notifications', async () => {
      const notifications = [
        {
          id: 'notification-1',
          type: 'PROJECT_MATCH',
          title: 'New project match',
          message: '"Green Education" may be a good match for you.',
          projectId: 'project-1',
          isRead: false,
          createdAt: new Date('2026-09-15T10:00:00Z'),
          readAt: null,
        },
      ];

      notificationService.getMyNotifications.mockResolvedValue(notifications);

      const result = await controller.getMyNotifications('user-1');

      expect(result).toEqual(notifications);

      expect(notificationService.getMyNotifications).toHaveBeenCalledWith(
        'user-1',
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      notificationService.getUnreadCount.mockResolvedValue(3);

      const result = await controller.getUnreadCount('user-1');

      expect(result).toEqual({
        count: 3,
      });

      expect(notificationService.getUnreadCount).toHaveBeenCalledWith('user-1');
    });

    it('should return zero when there are no unread notifications', async () => {
      notificationService.getUnreadCount.mockResolvedValue(0);

      const result = await controller.getUnreadCount('user-1');

      expect(result).toEqual({
        count: 0,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read for current user', async () => {
      const notification = {
        id: 'notification-1',
        type: 'PROJECT_MATCH',
        title: 'New project match',
        message: '"Green Education" may be a good match for you.',
        projectId: 'project-1',
        isRead: true,
        createdAt: new Date('2026-09-15T10:00:00Z'),
        readAt: new Date('2026-09-15T11:00:00Z'),
      };

      notificationService.markAsRead.mockResolvedValue(notification);

      const result = await controller.markAsRead('user-1', 'notification-1');

      expect(result).toEqual(notification);

      expect(notificationService.markAsRead).toHaveBeenCalledWith(
        'user-1',
        'notification-1',
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all current user notifications as read', async () => {
      notificationService.markAllAsRead.mockResolvedValue(undefined);

      const result = await controller.markAllAsRead('user-1');

      expect(result).toEqual({
        success: true,
      });

      expect(notificationService.markAllAsRead).toHaveBeenCalledWith('user-1');
    });
  });
});
