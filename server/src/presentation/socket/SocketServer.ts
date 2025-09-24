// socketServer.ts
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';

// ===== Main App Imports =====
import { UserRepository } from '../../data/repositories/UserRepository';
import { SUserRepositoryImpl } from '../../data/repositories/SUserRepositoryImpl';
import { PostRepository } from '../../data/repositories/PostRepository';
import { CommentRepository } from '../../data/repositories/CommentRepository';
import { ReportRepository } from '../../data/repositories/ReportRepository';
import { AdminOverviewRepository } from '../../data/repositories/AdminOverviewRepository';
import { NotificationRepo } from '../../data/repositories/NotificationRepo';
import { NotificationService as MainNotificationService } from '../../useCase/notificationServiceUsecase';
import { UserSocketService as MainUserSocketService } from '../../useCase/socket/socketServices/userSocketService';
import { PostSocketService } from '../../useCase/socket/socketServices/postSocketService';
import { CommentSocketService } from '../../useCase/socket/socketServices/commentSocketService';
import { AdminSocketService } from '../../useCase/socket/socketServices/adminSocketService';
import { AdminOverviewService } from '../../useCase/adminOverviewUsecase';
import { PostSocketHandler } from './socketHandlers/postHandlers';
import { CommentSocketHandler } from './socketHandlers/commentHandlers';
import { UserSocketHandler as MainUserSocketHandler } from './socketHandlers/userHandlers';
import { AdminSocketHandler} from './socketHandlers/adminHandlers';

// ===== Chat Imports =====
import { GroupRepository } from '../../data/repositories/GroupRepository';
import { ChatRepository } from '../../data/repositories/ChatRepository';
import { CallHistoryRepository } from '../../data/repositories/CallHistoryRepository';
import { GroupMessageRepository } from '../../data/interfaces/MessageRepository';
import { UserSocketService as ChatUserSocketService } from '../../useCase/ChatSocket/ChatSocketServices/userSocketService';
import { ChatService } from '../../useCase/ChatSocket/ChatSocketServices/chatService';
import { CallSocketService } from '../../useCase/ChatSocket/ChatSocketServices/callSocketService';
import { GroupSocketService } from '../../useCase/ChatSocket/ChatSocketServices/groupSocketService';
import { NotificationService as ChatNotificationService } from '../../useCase/ChatSocket/ChatSocketServices/notificationService';
import { ChatSocketHandler } from './ChatSocketHandlers/chatHandlers';
import { UserSocketHandler } from './ChatSocketHandlers/userHandlers';
import { CallHandlers } from './ChatSocketHandlers/callHandlers';
import { GroupSocketHandler } from './ChatSocketHandlers/groupHandlers';

let io: Server | null = null;

export const initializeSocket = (server: ReturnType<typeof createServer>): Server => {
  if (io) {
    console.warn('⚠️ Socket.IO already initialized!');
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: [
        "https://social-app-ten-nu.vercel.app",
        "http://localhost:3001",
        "http://192.168.1.7:3001"
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'],
      credentials: true
    },
    transports: ['polling', 'websocket']
  });

  // Shared repositories
  const userRepository = new UserRepository();
  const mainUserRepository = new SUserRepositoryImpl();
  const notificationRepository = new NotificationRepo();

  // ===== Main App Services =====
  const postRepository = new PostRepository();
  const commentRepository = new CommentRepository();
  const reportRepository = new ReportRepository();
  const adminOverviewRepository = new AdminOverviewRepository();
  const adminOverviewService = new AdminOverviewService(adminOverviewRepository, reportRepository);
  const mainNotificationService = new MainNotificationService(io, mainUserRepository, userRepository, notificationRepository);
  const postSocketService = new PostSocketService(io, userRepository, postRepository, mainNotificationService);
  const commentSocketService = new CommentSocketService(io, commentRepository, userRepository, mainNotificationService, postRepository);
  const adminSocketService = new AdminSocketService(io, adminOverviewService, mainUserRepository, reportRepository, mainNotificationService, postRepository);
  const mainUserSocketService = new MainUserSocketService(io, userRepository, mainUserRepository, mainNotificationService);

  // ===== Chat Services =====
  const chatRepository = new ChatRepository();
  const callHistoryRepository = new CallHistoryRepository();
  const groupMessageRepository = new GroupMessageRepository();
  const chatNotificationService = new ChatNotificationService(io, mainUserRepository, userRepository, notificationRepository);
  const chatService = new ChatService(chatRepository, mainUserRepository, io);
  const callSocketService = new CallSocketService(mainUserRepository, userRepository, callHistoryRepository, io);
  const chatUserSocketService = new ChatUserSocketService(io, userRepository, mainUserRepository);
  const groupRepository = new GroupRepository();
  const groupSocketService = new GroupSocketService(groupRepository, mainUserRepository, groupMessageRepository, chatNotificationService);
  const groupSocketHandler = new GroupSocketHandler(groupSocketService);

  // ===== On Connection =====
  io.on('connection', async (socket: Socket) => {
    console.log(`[${new Date().toISOString()}] 🔌 Client connected: ${socket.id}`);

    const users = await mainUserRepository.getActiveUsers();
    socket.emit('onlineUsers', { users });

    // Main handlers
    new MainUserSocketHandler(socket, mainUserSocketService);
    new PostSocketHandler(socket, postSocketService);
    new CommentSocketHandler(socket, commentSocketService);
    new AdminSocketHandler(socket, adminSocketService);

    // Chat handlers
    new UserSocketHandler (socket, chatUserSocketService);
    new ChatSocketHandler(socket, chatService);
    new CallHandlers(socket, callSocketService);
    groupSocketHandler.registerHandlers(socket);

    socket.on('disconnect', () => {
      console.log(`[${new Date().toISOString()}] ❌ Client disconnected: ${socket.id}`);
    });
  });

  console.log('✅ Socket.IO initialized with Main App + Chat handlers.');
  return io;
};

export const getSocketInstance = (): Server => {
  if (!io) throw new Error('Socket.IO not initialized.');
  return io;
};
