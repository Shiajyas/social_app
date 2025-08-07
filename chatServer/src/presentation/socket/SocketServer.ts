import { Server, Socket } from 'socket.io';
import { createServer } from 'http';

import { UserRepository } from '../../data/repositories/UserRepository';
import { IGroupRepository } from '../../data/interfaces/IGroupRepository';
import { GroupRepository } from '../../data/repositories/GroupRepository';
import { SUserRepositoryImpl } from '../../data/repositories/SUserRepositoryImpl';
import { ChatRepository } from '../../data/repositories/ChatRepository';
import IChatRepository from '../../data/interfaces/IChatRepository';

import { CallHistoryRepository } from '../../data/repositories/CallHistoryRepository';
import { UserSocketService } from '../../useCase/socket/socketServices/userSocketService';
import { ISUserRepository } from '../../data/interfaces/ISUserRepository';

import { ChatService } from '../../useCase/socket/socketServices/chatService';
import { CallSocketService } from '../../useCase/socket/socketServices/callSocketService';

import { chatHandlers } from './socketHandlers/chatHandlers';
import { userHandlers } from './socketHandlers/userHandlers';
import { callHandlers } from './socketHandlers/callHandlers';

import { GroupSocketHandler } from './socketHandlers/groupHandlers';
import { GroupSocketService } from '../../useCase/socket/socketServices/groupSocketService';

import { NotificationService } from '../../useCase/socket/socketServices/notificationService';
import { INotificationService } from '../../useCase/socket/socketServices/Interface/InotificationService';

import { NotificationRepo } from '../../data/repositories/NotificationRepo';
import { InotificationRepo } from '../../data/interfaces/InotificationRepo';


import { IGroupMessageRepository } from '../../data/interfaces/IGroupMessageRepository';
import { GroupMessageRepository } from '../../data/repositories/MessageRepository';
import { IUserRepository } from '../../data/interfaces/IUserRepository';
import { ICallHistoryRepository } from '../../data/interfaces/ICallHistoryRepository';
import { IChatService } from '../../useCase/socket/socketServices/Interface/IChatService';
import { ICallSocketService } from '../../useCase/socket/socketServices/Interface/ICallSocketService';
import { IUserSocketService } from '../../useCase/socket/socketServices/Interface/IUserSocketService';
import { IGroupSocketService } from '../../useCase/socket/socketServices/Interface/IGroupSocketService';

let io: Server | null = null;

export const initializeSocket = (
  server: ReturnType<typeof createServer>,
): Server | void => {
  if (io) {
    console.warn('⚠️ Socket.IO already initialized!');
    return io;
  }

  // io = new Server(server, {
  //   cors: {
  //     origin:"*",
  //     methods: ['GET', 'POST', 'PUT', 'PATCH'],
  //     credentials: true,
  //   },
  // });


 io = new Server(server, {
  cors: {
    origin: "https://social-app-ten-nu.vercel.app", // ✅ specific origin only
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'],
    credentials: true
  },
  transports: ['polling', 'websocket'] // optional, but good
});

  // Instantiate repositories
  const userRepository : IUserRepository = new UserRepository();
  const mainUserRepository : ISUserRepository = new SUserRepositoryImpl();
  const chatRepository: IChatRepository= new ChatRepository();
  const callHistoryRepository : ICallHistoryRepository = new CallHistoryRepository();
  const notificationRepository : InotificationRepo = new NotificationRepo();
  const groupMessageRepository : IGroupMessageRepository = new GroupMessageRepository()

  const notificationService  : INotificationService = new NotificationService(
    io,
    mainUserRepository,
    userRepository,
    notificationRepository,
  );


  const chatService : IChatService = new ChatService(chatRepository, mainUserRepository, io);

  const callSocketService : ICallSocketService = new CallSocketService(
    mainUserRepository,
    userRepository,
    callHistoryRepository,
    io
  );

    const userSocketService : IUserSocketService = new UserSocketService(
    io,
    userRepository,
    mainUserRepository,

  );

const groupRepository : IGroupRepository = new GroupRepository();
const groupSocketService : IGroupSocketService = new GroupSocketService(groupRepository, mainUserRepository,groupMessageRepository, notificationService); 
const groupSocketHandler  = new GroupSocketHandler(groupSocketService); 

  // Handle socket connection
io.on('connection', async (socket: Socket) => {
    const users = await mainUserRepository.getActiveUsers();
  console.log('users***',);

  console.log(
    `[${new Date().toISOString()}] 🔌 Client connected:2 ${socket.id}`,
  );


  socket.emit('onlineUsers', { users });

  userHandlers(socket, userSocketService);
  chatHandlers(socket, chatService);
  callHandlers(socket, callSocketService);

  groupSocketHandler.registerHandlers(socket);
  

  socket.on('disconnect', () => {
    console.log(
      `[${new Date().toISOString()}] ❌ Client disconnected: ${socket.id}`,
    );
  });
});


  console.log('✅ Socket.IO initialized and ready.');
};
