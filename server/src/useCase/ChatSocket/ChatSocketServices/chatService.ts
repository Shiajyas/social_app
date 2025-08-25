import { IChatService } from './Interface/IChatService';
import IChatRepository from '../../../data/interfaces/IChatRepository';
import { Socket, Server } from 'socket.io';
import { IMessage } from '../../../core/domain/interfaces/IMessage';
import { IChat } from '../../../core/domain/interfaces/IChat';
import { ISUserRepository } from '../../../data/interfaces/ISUserRepository';

export class ChatService implements IChatService {
  constructor(
    private _ChatRepository: IChatRepository,
    private _UserRepository: ISUserRepository,
    private _Io: Server,
  ) {}

  async sendMessage(
    socket: Socket,
    chatId: string,
    senderId: string,
    message: {
      message: string;
      replyTo?: { _id: string } | null;
      type: 'link' | 'text' | 'image' | 'file';
      files?: { fileUrls: string[] }[];
    },
  ): Promise<void> {
    try {
      const chat = await this._ChatRepository.getChatById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      if (typeof message?.message !== 'string') {
        socket.emit('error', { message: 'Message content must be a string' });
        return;
      }

      const receiverId = !chat.isGroupChat
        ? chat.users.find(u => u._id.toString() !== senderId)?._id?.toString() || null
        : null;

      const files =
        message?.files?.[0]?.fileUrls?.map((url: string) => ({ url })) || [];

      const newMessage = await this._ChatRepository.saveMessage({
        chatId,
        senderId,
        receiverId,
        content: message.message,
        replyTo: message.replyTo?._id?.toString() || null,
        type: message.type || 'text',
        files,
      });

      await this._ChatRepository.updateLastMessage(chatId, newMessage._id);

      // Emit to chat room (broadcast)
      this._Io.to(chatId).emit('messageReceived', newMessage);

      // Directly notify the receiver (if DM and online)
      if (receiverId) {
        const receiver = await this._UserRepository.findById(receiverId);
        if (receiver?.chatSocketId) {
          socket.to(receiver.chatSocketId).emit('chatUpdated', newMessage);
        } else {
          const sockets = await this._UserRepository.getSocketIds(receiverId);
          sockets.forEach(sid => {
            socket.to(sid).emit('chatUpdated', newMessage);
          });
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      this.handleError(socket, error, 'messageError');
    }
  }

  async saveMessage(message: IMessage): Promise<IMessage> {
    const savedMessage = await this._ChatRepository.saveMessage(message);
    return {
      ...savedMessage,
      senderId: message.senderId,
      receiverId: message.receiverId,
      type: message.type,
    } as unknown as IMessage;
  }

  async updateLastMessage(chatId: string, messageId: string): Promise<void> {
    await this._ChatRepository.updateLastMessage(chatId, messageId);
  }

  async getMessages(
    socket: Socket,
    chatId: string,
    page: number,
    limit: number,
  ): Promise<void> {
    try {
      const messages = await this._ChatRepository.getMessages(chatId, page, limit);
      socket.emit('messagesFetched', { messages });
    } catch (error) {
      this.handleError(socket, error, 'fetchMessagesError');
    }
  }

  async getChatById(chatId: string): Promise<IChat | null> {
    const chat = await this._ChatRepository.getChatById(chatId);
    return chat ? {
      ...chat,
      updatedAt: new Date(),
      $assertPopulated: () => { },
      $clearModifiedPaths: () => { },
      $clone: () => chat,
    } as unknown as IChat : null;
  }

  async createGroupChat(users: string[]): Promise<IChat> {
    const groupChat = await this._ChatRepository.createGroupChat(users);
    return {
      ...groupChat,
      updatedAt: new Date(),
      $assertPopulated: () => { },
      $clearModifiedPaths: () => { },
      $clone: () => groupChat,
    } as unknown as IChat;
  }

  async getUserChats(
    socket: Socket,
    userId: { userId: string },
  ): Promise<void> {
    try {
      const chats = await this._ChatRepository.getUserChats(userId.userId);
      const onlineUsers = await this._UserRepository.getActiveUsers(); // Optional usage
      socket.emit('chatsList', { chats });
    } catch (error) {
      this.handleError(socket, error, 'getChatsError');
    }
  }

  async createChat(
    socket: Socket,
    userId: string,
    receiverId: string,
  ): Promise<void> {
    try {
      const chat = await this._ChatRepository.getOrCreateOneToOneChat(userId, receiverId);
      const senderSockets = await this._UserRepository.getSocketIds(userId);
      const receiverSockets = await this._UserRepository.getSocketIds(receiverId);

      [...senderSockets, ...receiverSockets].forEach(sid => {
        this._Io.to(sid).emit('chatCreated', { chat });
      });
    } catch (error) {
      this.handleError(socket, error, 'messageError');
    }
  }

  async editMessage(
    socket: Socket,
    chatId: string,
    messageId: string,
    newContent: string,
  ) {
    try {
      const updatedMessage = await this._ChatRepository.editMessage(messageId, newContent);
      this._Io.to(chatId).emit('messageEdited', updatedMessage);
    } catch (error) {
      this.handleError(socket, error, 'editMessageError');
    }
  }

  async deleteMessage(
    socket: Socket,
    chatId: string,
    messageId: string,
  ): Promise<void> {
    try {
      await this._ChatRepository.deleteMessage(messageId);
      this._Io.to(chatId).emit('messageDeleted', messageId);
    } catch (error) {
      this.handleError(socket, error, 'deleteMessageError');
    }
  }

  private handleError(socket: Socket, error: unknown, event: string) {
    console.error(`❌ ${event}:`, error);
    socket.emit(event, {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
