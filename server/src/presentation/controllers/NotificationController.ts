import { Request, Response } from 'express';
import { INotificationService } from '../../useCase/interfaces/InotificationService';
import { HttpStatus,ResponseMessages } from '../../infrastructure/constants/notificationconstants';

export class NotificationController {
  private _NotificationService: INotificationService;

  constructor(notificationService: INotificationService) {
    this._NotificationService = notificationService;
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params;

      if (!userId) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: ResponseMessages.USER_ID_REQUIRED });
        return;
      }

      const unreadCount = await this._NotificationService.getUnreadCount(userId);

      res.status(HttpStatus.OK).json({
        message: ResponseMessages.UNREAD_COUNT_FETCH_SUCCESS,
        unreadCount,
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: ResponseMessages.UNREAD_COUNT_FETCH_FAILED,
      });
    }
  }

  async markNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params;

      if (!userId) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: ResponseMessages.USER_ID_REQUIRED });
        return;
      }

      await this._NotificationService.markNotificationsAsRead(userId);

      res.status(HttpStatus.OK).json({ message: ResponseMessages.MARK_AS_READ_SUCCESS });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: ResponseMessages.MARK_AS_READ_FAILED,
      });
    }
  }

  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;

      if (!userId) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: ResponseMessages.USER_ID_REQUIRED });
        return;
      }

      const { notifications, nextPage } = await this._NotificationService.getNotifications(
        userId as string,
        page,
        limit,
      );

      res.status(HttpStatus.OK).json({
        message: ResponseMessages.NOTIFICATIONS_FETCH_SUCCESS,
        notifications,
        nextPage,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: ResponseMessages.NOTIFICATIONS_FETCH_FAILED,
      });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;

      if (!notificationId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: ResponseMessages.NOTIFICATION_ID_REQUIRED,
        });
        return;
      }

      await this._NotificationService.deleteNotification(notificationId);

      res.status(HttpStatus.OK).json({
        message: ResponseMessages.NOTIFICATION_DELETE_SUCCESS,
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: ResponseMessages.NOTIFICATION_DELETE_FAILED,
      });
    }
  }
}
