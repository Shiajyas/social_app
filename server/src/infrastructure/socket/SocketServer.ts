import { Server, Socket } from 'socket.io';
import { createServer } from 'http';

// Repositories
import { UserRepository } from '../../data/repositories/UserRepository';
import { SUserRepositoryImpl } from '../../data/repositories/SUserRepositoryImpl';
import { PostRepository } from '../../data/repositories/PostRepository';
import { CommentRepository } from '../../data/repositories/CommentRepository';
// Services
import { NotificationService } from '../../useCase/notificationService';
import { UserSocketService } from '../../useCase/socket/socketServices/userSocketService';
import { PostSocketService } from '../../useCase/socket/socketServices/postSocketService';
import { CommentSocketService } from '../../useCase/socket/socketServices/commentSocketService';
import { AdminSocketService } from '../../useCase/socket/socketServices/adminSocketService';
import { AdminOverviewService } from '../../useCase/adminOverviewService';
import { ReportRepository } from '../../data/repositories/ReportRepository';
import { IAdminOverviewRepository } from '../../data/interfaces/IAdminOverviewRepository';
import { AdminOverviewRepository } from '../../data/repositories/AdminOverviewRepository';
import { InotificationRepo } from '../../data/interfaces/InotificationRepo';
import { INotificationService } from '../../useCase/interfaces/InotificationService';
import { NotificationRepo } from '../../data/repositories/NotificationRepo';
// Handlers
import { postHandlers } from './socketHandlers/postHandlers';
import { commentHandlers } from './socketHandlers/commentHandlers';
import { userHandlers } from './socketHandlers/userHandlers';
import { adminHandlers } from './socketHandlers/adminHandlers';
import { IPostRepository } from '../../data/interfaces/IPostRepository';

let io: Server | null = null;

export const initializeSocket = (
  server: ReturnType<typeof createServer>,
): Server | void => {
  if (io) {
    console.warn('⚠️ Socket.IO already initialized!');
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3001',
        'http://192.168.1.7:3001', // Frontend IP
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH'],
      credentials: true,
    },
  });

  // Instantiate repositories
  const userRepository = new UserRepository();
  const mainUserRepository = new SUserRepositoryImpl();
  const postRepository: IPostRepository = new PostRepository();
  const commentRepository = new CommentRepository();
  const reportRepository = new ReportRepository();
  const adminOverviewRepository: IAdminOverviewRepository = new AdminOverviewRepository();
  const adminOverviewService = new AdminOverviewService(adminOverviewRepository, reportRepository);
  const notificationRepository : InotificationRepo = new NotificationRepo();

  // Instantiate services
  const notificationService  = new NotificationService(
    io,
    mainUserRepository,
    userRepository,
    notificationRepository
  );
  const postSocketService = new PostSocketService(
    io,
    userRepository,
    postRepository,
    notificationService,
  );
  const commentSocketService = new CommentSocketService(
    io,
    commentRepository,
    userRepository,
    notificationService,
    postRepository,
  );
  const adminSocketService = new AdminSocketService(
    io,
    adminOverviewService,
    mainUserRepository,
    reportRepository,
    notificationService,
    postRepository
  );
  const userSocketService = new UserSocketService(
    io,
    userRepository,
    mainUserRepository,
    notificationService,
   
  );

  // Handle socket connection
  io.on('connection', (socket: Socket) => {
    console.log(
      `[${new Date().toISOString()}] 🔌 Client connected: ${socket.id}`,
    );

    socket.emit('onlineUsers', { users:  mainUserRepository.getActiveUsers() });

    // console.log("onlineUsers8888", mainUserRepository.getActiveUsers());
    // Register socket event handlers
    userHandlers(socket, userSocketService);
    postHandlers(socket, postSocketService);
    commentHandlers(socket, commentSocketService);
    adminHandlers(socket, adminSocketService); //

    socket.on('disconnect', () => {
      console.log(
        `[${new Date().toISOString()}] ❌ Client disconnected: ${socket.id}`,
      );
    });
  });

  console.log('✅ Socket.IO initialized and ready.');
};
