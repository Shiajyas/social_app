import { Notification } from '../core/domain/models/NotificationModel';
import { INotificationService } from './interfaces/InotificationService';
import { ISUserRepository } from '../data/interfaces/ISUserRepository';
import { IUserRepository } from '../data/interfaces/IUserRepository';
import { InotificationRepo } from '../data/interfaces/InotificationRepo';
import { INotification } from '../core/domain/interfaces/INotification';
import { Server } from 'socket.io';

export class NotificationService implements INotificationService {
  private _Io: Server;
  private _OnlineUserRepository: ISUserRepository;
  private _MainUserRepo: IUserRepository;
  private _NotificationRepo: InotificationRepo;

  constructor(
    io: Server,
    userRepository: ISUserRepository,
    mainRepo: IUserRepository,
    notificationRepo: InotificationRepo
  ) {
    this._Io = io;
    this._OnlineUserRepository = userRepository;
    this._MainUserRepo = mainRepo;
    this._NotificationRepo = notificationRepo;
  }

  async sendNotification(
    senderId: string,
    receiverIds: string[],
    type: 'follow' | 'unfollow' | 'like' | 'comment' | 'mention' | 'post' | 'replay',
    message: string,
    postId?: string,
    senderName?: string
  ): Promise<void> {
    try {

      if (!receiverIds || receiverIds.length === 0) {
        return;
      }

      // Normalize and fetch users
      const allReceivers = await Promise.all(
        receiverIds.map(async (id) => {
          if (!id) return null;

          const normalizedId =
            typeof id === 'object' && id !== null && '_id' in id
              ? (id as { _id: string })._id.toString()
              : id.toString();

          const user = await this._MainUserRepo.findById(normalizedId);
          if (!user) return null;

          // Get ALL socket IDs for this user
          const socketIds = await this._OnlineUserRepository.getSocketIds(normalizedId);

          return { _id: user._id.toString(), socketIds };
        })
      );

      // Filter valid users
      const validReceivers = allReceivers.filter(Boolean) as {
        _id: string;
        socketIds: string[];
      }[];

      if (!validReceivers.length) {
        return;
      }

      // Extract IDs for storage
      const receiverUserIds = validReceivers.map((r) => r._id);

      // Save notification in DB
      const notification = new Notification({
        senderId,
        receiverId: receiverUserIds, // store array
        type,
        message,
        postId,
        senderName,
        isRead: false,
      });

      await notification.save();

      // Emit per user, across all their sockets
      for (const receiver of validReceivers) {
        if (receiver.socketIds.length > 0) {
          for (const sid of receiver.socketIds) {
            this._Io.to(sid).emit('newNotification', {
              type,
              message,
              senderId,
              receiverId: receiver._id,
              postId,
              senderName,
              isRead: false,
              timestamp: new Date(),
            });
          }
          console.log(` Notification sent to ${receiver._id} (${receiver.socketIds.length} sockets)`);
        } else {
          console.log(`User ${receiver._id} is offline. Notification stored only in DB.`);
        }
      }
    } catch (error) {
      console.error(' Error in sendNotification:', error);
    }
  }

  getUnreadCount(userId: string): Promise<number> {
    return this._NotificationRepo.getUnreadCount(userId);
  }

  markNotificationsAsRead(userId: string): Promise<void> {
    return this._NotificationRepo.markNotificationsAsRead(userId);
  }

  getNotifications(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ notifications: INotification[]; nextPage: number | null }> {
    return this._NotificationRepo.getNotifications(userId, page, limit);
  }

  deleteNotification(notificationId: string): Promise<void> {
    return this._NotificationRepo.deleteNotification(notificationId);
  }
}
