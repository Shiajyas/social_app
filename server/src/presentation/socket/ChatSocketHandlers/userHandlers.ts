import { Socket } from 'socket.io';
import { IUserSocketService } from '../../../useCase/ChatSocket/ChatSocketServices/Interface/IUserSocketService';

export class UserSocketHandler {
  private _Socket: Socket;
  private _UserService: IUserSocketService;

  constructor(socket: Socket, userService: IUserSocketService) {
    this._Socket = socket;
    this._UserService = userService;

    this.RegisterHandlers();
  }

  private RegisterHandlers() {
    this._Socket.on('joinUser', this.JOIN_USER);
    this._Socket.on('followUser', this.FOLLOW_USER);
    this._Socket.on('unfollowUser', this.UNFOLLOW_USER);
    this._Socket.on('userOnline', this.USER_ONLINE);
    this._Socket.on('logOut', this.LOG_OUT);
    this._Socket.on('getOnlineUsers', this.GET_ONLINE_USERS);
    this._Socket.on('updateChatSocketId', this.UPDATE_CHAT_SOCKET_ID);
    this._Socket.on('disconnect', this.DISCONNECT);
  }

  private JOIN_USER = (id: string) => {
    this._UserService.addUser(this._Socket, id);
  };

  private FOLLOW_USER = (data: { userId: string; followingId: string }) => {
    this._UserService.handleFollow(this._Socket, data.userId, data.followingId);
  };

  private UNFOLLOW_USER = (data: { userId: string; followingId: string }) => {
    this._UserService.handleUnfollow(this._Socket, data.userId, data.followingId);
  };

  private USER_ONLINE = (userId: string) => {
    this._Socket.emit('updateOnlineUsers', userId);
  };

  private LOG_OUT = (userId: string) => {
    console.log(`🔌 Logging out user ${userId} with socket ${this._Socket.id}`);
    this._UserService.removeUser(this._Socket, userId);
  };

  private GET_ONLINE_USERS = () => {
    this._UserService.getOnlineUsers(this._Socket);
  };

  private UPDATE_CHAT_SOCKET_ID = (data: { userId: string }) => {
    console.log(`Updating chat socket ID for user with socket ${this._Socket.id}`);
    this._UserService.updateChatSocketId(data.userId, this._Socket.id);
  };

  private DISCONNECT = () => {
    console.log(`🔌 User disconnected with socket ${this._Socket.id}`);
    this._UserService.removeUser(this._Socket, '');
  };
}
