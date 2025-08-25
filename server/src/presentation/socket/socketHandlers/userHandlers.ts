import { Socket } from 'socket.io';
import { IUserSocketService } from '../../../useCase/socket/socketServices/Interface/IUserSocketService';

export class UserSocketHandler {
  private _socket: Socket;
  private _userService: IUserSocketService;

  constructor(socket: Socket, userService: IUserSocketService) {
    this._socket = socket;
    this._userService = userService;

    this.registerHandlers();
  }

  private registerHandlers() {
    this._socket.on('joinUser', this.JOIN_USER);
    this._socket.on('followUser', this.FOLLOW_USER);
    this._socket.on('unfollowUser', this.UNFOLLOW_USER);
    this._socket.on('userOnline', this.USER_ONLINE);
    this._socket.on('logOut', this.LOG_OUT);
    this._socket.on('getOnlineUsers', this.GET_ONLINE_USERS);
    this._socket.on('admin:userBlocked', this.ADMIN_USER_BLOCKED);
    this._socket.on('disconnect', this.DISCONNECT);
  }

  private JOIN_USER = (id: string) => {
    this._userService.addUser(this._socket, id);
  };

  private FOLLOW_USER = (data: { userId: string; followingId: string }) => {
    console.log(data, '>>>123');
    this._userService.handleFollow(this._socket, data.userId, data.followingId);
  };

  private UNFOLLOW_USER = (data: { userId: string; followingId: string }) => {
    this._userService.handleUnfollow(this._socket, data.userId, data.followingId);
  };

  private USER_ONLINE = (userId: string) => {
    console.log(`User ${userId} is online`);
    this._socket.emit('updateOnlineUsers', userId);
  };

  private LOG_OUT = (userId: string) => {
    console.log(`🔌 Logging out user ${userId} with socket ${this._socket.id}`);
    this._userService.removeUser(this._socket, userId);
  };

  private GET_ONLINE_USERS = () => {
    this._userService.getOnlineUsers(this._socket);
  };

  private ADMIN_USER_BLOCKED = ({ userId }: { userId: string }) => {
    this._userService.blockUser(this._socket, userId);
  };

  private DISCONNECT = () => {
    console.log(`🔌 User disconnected with socket ${this._socket.id}`);
    this._userService.removeUser(this._socket, '');
  };
}
