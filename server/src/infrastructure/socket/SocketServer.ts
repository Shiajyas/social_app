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
import { IUserRepository } from '../../data/interfaces/IUserRepository';
import { IReportRepository } from '../../data/interfaces/IReportRepository';
import { ICommentRepository } from '../../data/interfaces/ICommentRepository';
import { IPostSocketService } from '../../useCase/socket/socketServices/Interface/IPostSocketService';
import { ICommentSocketService } from '../../useCase/socket/socketServices/Interface/ICommentSocketService';
import { ISocketAdminService } from '../../useCase/socket/socketServices/Interface/ISocketAdminService';
import { IUserSocketService } from '../../useCase/socket/socketServices/Interface/IUserSocketService';

let io: Server | null = null;

export const initializeSocket = (
  server: ReturnType<typeof createServer>,
): Server | void => {
  if (io) {
    console.warn('⚠️ Socket.IO already initialized!');
    return io;
  }

  io = new Server(server, {
     path: '/chat/socket.io',
    cors: {
      origin: "*",
      methods: ['GET', 'POST', 'PUT', 'PATCH','OPTIONS'],
      credentials: true,
    },
  });



  // Instantiate repositories
  const userRepository : IUserRepository = new UserRepository();
  const mainUserRepository : SUserRepositoryImpl = new SUserRepositoryImpl();
  const postRepository: IPostRepository = new PostRepository();
  const commentRepository : ICommentRepository = new CommentRepository();
  const reportRepository : IReportRepository = new ReportRepository();
  const adminOverviewRepository: IAdminOverviewRepository = new AdminOverviewRepository();
  const adminOverviewService: AdminOverviewService  = new AdminOverviewService(adminOverviewRepository, reportRepository);
  const notificationRepository : InotificationRepo = new NotificationRepo();

const notificationService: NotificationService = new NotificationService(
  io,
  mainUserRepository,
  userRepository,
  notificationRepository
);
  const postSocketService : IPostSocketService= new PostSocketService(
    io,
    userRepository,
    postRepository,
    notificationService,
  );
  const commentSocketService : ICommentSocketService = new CommentSocketService(
    io,
    commentRepository,
    userRepository,
    notificationService,
    postRepository,
  );
  const adminSocketService : ISocketAdminService = new AdminSocketService(
    io,
    adminOverviewService,
    mainUserRepository,
    reportRepository,
    notificationService,
    postRepository
  );
  const userSocketService : IUserSocketService = new UserSocketService(
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



export const getSocketInstance = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Make sure to call initializeSocket() first.');
  }
  return io;
};
