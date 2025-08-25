import { Notification } from '../../../core/domain/models/NotificationModel';
import { INotificationService } from './Interface/InotificationService';
import { ISUserRepository } from '../../../data/interfaces/ISUserRepository';
import { IUserRepository } from '../../../data/interfaces/IUserRepository';
import { InotificationRepo } from '../../../data/interfaces/InotificationRepo';
import { INotification } from '../../../core/domain/interfaces/INotification';

import { Server } from 'socket.io';
import { SUser } from '../../../core/domain/interfaces/SUser';

export class NotificationService implements INotificationService {
  private _Io: Server;
  private _OnlineUserRepository: ISUserRepository;
  private _MainUserRepo: IUserRepository;
  private _NotificationRepo : InotificationRepo

  constructor(
    io: Server,
    userRepository: ISUserRepository,
    mainRepo: IUserRepository,
    notificationRepo : InotificationRepo
  ) {
    this._Io = io;
    this._OnlineUserRepository = userRepository;
    this._MainUserRepo = mainRepo;
    this._NotificationRepo = notificationRepo
  }

  async sendNotification(
    senderId: string,
    receiverIds: string[],
   type:
  | 'follow'
  | 'unfollow'
  | 'like'
  | 'comment'
  | 'mention'
  | 'post'
  | 'replay'
  | 'group-add',

    message: string,
    postId?: string,
    groupId?: string,
    senderName?: string,
  ): Promise<void> {
    try {
      console.log(`🔔 Sending notifications to ${receiverIds.length} users`);

      if (!receiverIds || receiverIds.length === 0) {
        console.log('⚠️ No receiver IDs provided. Skipping notification.');
        return;
      }

      // Fetch users from the main database
      const allReceivers = await Promise.all(
        receiverIds.map(async (id) => {
          if (!id) return null; // Ensure ID is valid before querying

          if (typeof id === 'object' && id !== null && '_id' in id) {
            id = (id as { _id: string })._id.toString(); // Extract `_id` from object and convert to string
          }

          const user = await this._MainUserRepo.findById(id.toString());
          const onlineUser = await this._OnlineUserRepository.findById(id.toString());
          // console.log(onlineUser, 'formm redis');
          if (!user) return null; // Ensure user exists

          return { _id: user._id, socketId: onlineUser?.chatSocketId || null };
        }),
      );
      let onlineUserss: SUser[] = await this._OnlineUserRepository.getActiveUsers();
     let  onlineUsers : string [] = onlineUserss.map((user: SUser) => user.id);
      console.log(onlineUsers, 'onlineUsers');

      // Filter out invalid users
      const validReceivers = allReceivers.filter(
        (receiver) => receiver !== null,
      );

      console.log('✅ Valid Receivers:', validReceivers);

      if (!validReceivers.length) {
        console.log(
          `⚠️ No valid receivers found. Notification will not be stored.`,
        );
        return;
      }

      // Extract user IDs for storage
      const receiverUserIds = validReceivers
        .map((receiver) => receiver?._id)
        .filter(Boolean);

      if (receiverUserIds.length === 0) {
        console.log(
          `⚠️ No valid receiver IDs found. Skipping notification storage.`,
        );
        return;
      }

      // Create a single notification object for all receivers
      const notification = new Notification({
        senderId,
        receiverId: receiverUserIds, // Store all valid receivers
        type,
        message,
        postId: postId ?? null,
        groupId: groupId ?? null,
        senderName,
        isRead: false,
      });

      // Save the notification in DB
      await notification.save();
      console.log(`✅ Notification saved for ${validReceivers.length} users`);

      // Emit real-time notifications **only to online users**
      validReceivers.forEach((receiver) => {
        if (receiver?.socketId) {
          this._Io.to(receiver.socketId).emit('newNotification', {
            type,
            message,
            senderId,
            receiverId: receiverUserIds,
            postId,
            groupId: groupId ?? null,
            senderName,
            isRead: false,
            timestamp: new Date(),
          });

          console.log(
            `📩 Notification sent to online user ${receiver._id} (Socket ID: ${receiver.socketId})`,
          );
        } else {
          console.log(
            `⚠️ User ${receiver?._id} is offline. Notification stored in DB.`,
          );
        }
      });
    } catch (error) {
      console.error('❌ Error in sendNotification:', error);
    }
  }

getUnreadCount(userId: string): Promise<number> {
  return this._NotificationRepo.getUnreadCount(userId);
  }

markNotificationsAsRead(userId: string): Promise<void> {
  return this._NotificationRepo.markNotificationsAsRead(userId);  

  }

  getNotifications(userId: string, page: number, limit: number): Promise<{ notifications: INotification[]; nextPage: number | null }> {
    return this._NotificationRepo.getNotifications(userId, page, limit);
  }

  deleteNotification(notificationId: string): Promise<void> {
    return this._NotificationRepo.deleteNotification(notificationId);
  }

}
