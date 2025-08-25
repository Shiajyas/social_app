import { INotification } from "../../../../core/domain/interfaces/INotification";
export interface INotificationService {
  sendNotification(
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
  ): Promise<void>;

  getUnreadCount(userId: string): Promise<number> 
  markNotificationsAsRead(userId: string): Promise<void> 
   getNotifications(userId: string, page: number, limit: number): Promise<{ notifications: INotification[]; nextPage: number | null }>
   deleteNotification(notificationId: string): Promise<void> 
}
