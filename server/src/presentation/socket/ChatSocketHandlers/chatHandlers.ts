import { Socket } from 'socket.io';
import { IChatService } from '../../../useCase/ChatSocket/ChatSocketServices/Interface/IChatService';
import { IMessage } from '../../../core/domain/interfaces/IMessage';

export class ChatSocketHandler {
  private _Socket: Socket;
  private _ChatService: IChatService;
  private static _ChatRooms = new Map<string, string>(); // socket.id -> chatId

  constructor(socket: Socket, chatService: IChatService) {
    this._Socket = socket;
    this._ChatService = chatService;

    this._RegisterHandlers();
  }

  private _RegisterHandlers() {
    this._Socket.on('joinChat', this._JoinChat);
    this._Socket.on('createChat', this._CreateChat);
    this._Socket.on('getChats', this._GetChats);
    this._Socket.on('fetchMessages', this._FetchMessages);
    this._Socket.on('sendMessage', this._SendMessage);
    this._Socket.on('typing', this._Typing);
    this._Socket.on('editMessage', this._EditMessage);
    this._Socket.on('deleteMessage', this._DeleteMessage);
    this._Socket.on('leaveChat', this._LeaveChat);
    this._Socket.on('sendFileMessage', this._SendFileMessage);
  }

  private _JoinChat = async (chatId: string) => {
    console.log('joinChat', chatId);

    const previousChatId = ChatSocketHandler._ChatRooms.get(this._Socket.id);
    if (previousChatId) {
      this._Socket.leave(previousChatId);
    }

    this._Socket.join(chatId);
    ChatSocketHandler._ChatRooms.set(this._Socket.id, chatId);

    await this._ChatService.getMessages(this._Socket, chatId, 0, 20);
  };

  private _CreateChat = async ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
    try {
      await this._ChatService.createChat(this._Socket, senderId, receiverId);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  private _GetChats = async (userId: { userId: string }) => {
    try {
      await this._ChatService.getUserChats(this._Socket, userId);
    } catch (error) {
      console.error('Error getting chats:', error);
    }
  };

  private _FetchMessages = async ({ chatId, page, limit }: { chatId: string; page: number; limit: number }) => {
    try {
      await this._ChatService.getMessages(this._Socket, chatId, page, limit);
    } catch (error) {
      console.error('Error fetching messages:', error);
      this._Socket.emit('error', { message: 'Failed to fetch messages' });
    }
  };

  private _SendMessage = async (newMessage: { chatId: string; senderId: string; message: string }) => {
    try {
      const { chatId, senderId } = newMessage;
      await this._ChatService.sendMessage(this._Socket, chatId, senderId, newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  private _Typing = ({ chatId, senderId }: { chatId: string; senderId: string }) => {
    this._Socket.to(chatId).emit('userTyping', { senderId });
  };

  private _EditMessage = async ({ chatId, messageId, newContent }: { chatId: string; messageId: string; newContent: string }) => {
    try {
      console.log('Editing message:', chatId, messageId, newContent);
      await this._ChatService.editMessage(this._Socket, chatId, messageId, newContent);
    } catch (error) {
      console.error('Error editing message:', error);
      this._Socket.emit('error', { message: 'Failed to edit message' });
    }
  };

  private _DeleteMessage = async ({ chatId, messageId }: { chatId: string; messageId: string }) => {
    try {
      await this._ChatService.deleteMessage(this._Socket, chatId, messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      this._Socket.emit('error', { message: 'Failed to delete message' });
    }
  };

  private _LeaveChat = (chatId: string) => {
    this._Socket.leave(chatId);
    ChatSocketHandler._ChatRooms.delete(this._Socket.id);
  };

  private _SendFileMessage = async (data: Partial<IMessage>) => {
    const { chatId, senderId, replyTo, files, type } = data;
    const message = 'message' in data ? data.message : 'shared file';
    console.log('📩 Received files via socket:', files);

    try {
      const newMessage = { senderId, message, files, replyTo, type: type || 'file' };
      await this._ChatService.sendMessage(this._Socket, chatId || '', senderId || '', newMessage || '');
    } catch (error) {
      console.error('❌ File message handling error:', error);
      this._Socket.emit('error', { message: 'Failed to send file message.' });
    }
  };
}
