import { Request, Response } from 'express';
import { INotificationService } from '../../useCase/interfaces/InotificationService';

export class NotificationController {
  private _NotificationService: INotificationService

  constructor(
    notificationService: INotificationService,
  ) {
    this._NotificationService = notificationService;
  }

  // Get unread notification count
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params;
      if (!userId) {
        res.status(400).json({ message: 'User ID is required' });
        return;
      }

      const unreadCount =
        await this._NotificationService.getUnreadCount(userId);
      console.log('unRead count : ', unreadCount);
      res.status(200).json({ unreadCount });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  // Mark notifications as read
  async markNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params;
      if (!userId) {
        res.status(400).json({ message: 'User ID is required' });
        return;
      }

      await this._NotificationService.markNotificationsAsRead(userId);
      res.status(200).json({ message: 'Notifications marked as read' });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  // Fetch paginated notifications
  async getNotifications(req: Request, res: Response) {
    try {
      const { userId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const { notifications, nextPage } =
        await this._NotificationService.getNotifications(
          userId as string,
          page,
          limit,
        );
      return res.json({ notifications, nextPage });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Failed to fetch notifications', error });
    }
  }

  // Delete a specific notification
  async deleteNotification(req: Request, res: Response) {
    try {
      const { notificationId } = req.params;
      if (!notificationId) {
        return res.status(400).json({ message: 'Notification ID is required' });
      }

      await this._NotificationService.deleteNotification(notificationId);
      return res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Failed to delete notification', error });
    }
  }
}
