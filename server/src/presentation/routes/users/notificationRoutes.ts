import { Router } from 'express';
import userAuthMiddleware from '../../middleware/userAuthMiddleware';
import { NotificationRepo } from '../../../data/repositories/NotificationRepo';
import { NotificationController } from '../../controllers/NotificationController';
import { InotificationRepo } from '../../../data/interfaces/InotificationRepo';
import { INotificationService } from '../../../useCase/interfaces/InotificationService';
import { NotificationService } from '../../../useCase/notificationServiceUsecase';
import { UserRepository } from '../../../data/repositories/UserRepository';
import { Server } from 'socket.io';
import { IUserRepository } from '../../../data/interfaces/IUserRepository';
import { SUserRepositoryImpl } from '../../../data/repositories/SUserRepositoryImpl';
import { ISUserRepository } from '../../../data/interfaces/ISUserRepository';
const io = new Server();

const router = Router();

const notificationRepository : InotificationRepo = new NotificationRepo();
const mainUserRepository: IUserRepository = new UserRepository();
const SessionRepository: ISUserRepository = new SUserRepositoryImpl();

const notificationService : INotificationService = new NotificationService(io,SessionRepository,mainUserRepository,notificationRepository);
  


const notificationController = new NotificationController(notificationService);

// Fetch unread notification count
router.get('/unreadcount/:id', userAuthMiddleware.authenticate, (req, res) =>
  notificationController.getUnreadCount(req, res),
);

// Mark notifications as read
router.post('/mark-as-read/:id', userAuthMiddleware.authenticate, (req, res) =>
  notificationController.markNotificationsAsRead(req, res),
);

// Fetch paginated notifications
router.get('/', userAuthMiddleware.authenticate, async (req, res) => {
  await notificationController.getNotifications(req, res);
});

// Delete a notification
router.delete(
  '/:notificationId',
  userAuthMiddleware.authenticate,
  async (req, res) => {
    await notificationController.deleteNotification(req, res);
  },
);

export default router;
