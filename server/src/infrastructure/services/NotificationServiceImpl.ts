import { NotificationService } from './interfaces/INotificationService';

export class NotificationServiceImpl implements NotificationService {
  sendNotification(recipients: string[], message: any): void {
   
    console.log('Sending notification to', recipients);
    console.log('Message:', message);
  }
}
