import { Socket } from 'socket.io';
import { IUserSocketService } from './Interface/IUserSocketService';
import { ISUserRepository } from '../../../data/interfaces/ISUserRepository';
import { IUserRepository } from '../../../data/interfaces/IUserRepository';
import { ObjectId } from 'mongodb';
import { Server } from 'socket.io';

export class UserSocketService implements IUserSocketService {
  private _Io: Server;
  private _UserRepository: IUserRepository;
  private _SessionUserRepository: ISUserRepository;
  io: any;

  constructor(
    ioInstance: Server,
    userRepo: IUserRepository,
    sessionUserRepo: ISUserRepository,
  ) {
    this._Io = ioInstance;
    this._UserRepository = userRepo;
    this._SessionUserRepository = sessionUserRepo;
  }

  private async broadcastOnlineUserCountToAdmins() {
    const count = await this._SessionUserRepository.getActiveUserCount();
    this._Io.to('admin').emit('admin:updateOnlineCount', count);
  }

  async addUser(socket: Socket, userId: string): Promise<void> {
    try {
      console.log(`🔹 Adding user ${userId} with socket ID ${socket.id}`);

      await this._SessionUserRepository.addUser({ id: userId, socketId: socket.id });

      socket.emit('addUserSuccess', { userId });

      const onlineUsers = (await this._SessionUserRepository.getActiveUsers()).map((user) => user.id);
      this.io.emit('updateOnlineUsers', onlineUsers);

      await this.broadcastOnlineUserCountToAdmins();
    } catch (error) {
      this.handleError(socket, error, 'addUserError');
    }
  }

async removeUser(socket: Socket, userId?: string): Promise<void> {
  try {
    const resolvedUserId =
      userId || (await this._SessionUserRepository.findUserIdBySocket(socket.id));

    if (!resolvedUserId) {
      console.warn(`⚠️ Could not resolve user for socket ID ${socket.id}`);
      return;
    }

    console.log(`🗑️ Removing user ${resolvedUserId} with socket ID ${socket.id}`);

    await this._SessionUserRepository.removeUser(socket.id);

    const onlineUsers = (await this._SessionUserRepository.getActiveUsers()).map((user) => user.id);
    this._Io.emit('updateOnlineUsers', onlineUsers);

    await this.broadcastOnlineUserCountToAdmins();
  } catch (error) {
    this.handleError(socket, error, 'removeUserError');
  }
}


  async getOnlineUsers(socket: Socket): Promise<void> {
    try {
      const onlineUsers = (await this._SessionUserRepository.getActiveUsers()).map((user) => user.id);

      console.log('Online users:', onlineUsers);
      socket.emit('updateOnlineUsers', onlineUsers);
    } catch (error) {
      this.handleError(socket, error, 'getOnlineUsersError');
    }
  }

  async joinUser(socket: Socket, id: string): Promise<void> {
    try {
      await this._SessionUserRepository.addUser({ id, socketId: socket.id });
      socket.emit('joinSuccess', { userId: id });
      this.getOnlineUsers(socket);
    } catch (error) {
      this.handleError(socket, error, 'joinError');
    }
  }

  async handleFollow(socket: Socket, userId: string, followingId: string): Promise<void> {
    if (!userId || !followingId || userId === followingId) {
      throw new Error('Invalid follow request.');
    }

    const sender = await this._UserRepository.findById(userId);
    const targetUser = await this._UserRepository.findById(followingId);
    if (!sender || !targetUser) throw new Error('User not found.');

    if (sender.following?.includes(new ObjectId(followingId))) {
      throw new Error('Already following this user.');
    }

    await this._UserRepository.update(
      { _id: userId },
      { $addToSet: { following: followingId } },
    );
    await this._UserRepository.update(
      { _id: followingId },
      { $addToSet: { followers: userId } },
    );

   

    this.io.emit('followSuccess', { followingId });
  }

  async handleUnfollow(socket: Socket, userId: string, followingId: string): Promise<void> {
    try {
      const success = await this._UserRepository.unfollow(userId, followingId);

      if (!success) {
        socket.emit('unfollowError', { message: 'Unfollow operation failed.' });
        return;
      }

      this.io.emit('unfollowSuccess', { followingId });
    } catch (error) {
      this.handleError(socket, error, 'unfollowError');
    }
  }

  async followUser(socket: Socket, data: { userId: string; followingId: string }): Promise<void> {
    try {
      const { userId, followingId } = data;

      const sender = await this._UserRepository.findById(userId);
      const targetUser = await this._UserRepository.findById(followingId);
      if (!sender || !targetUser) throw new Error('User not found.');

      await this._UserRepository.update(
        { _id: userId },
        { $addToSet: { following: followingId } },
      );
      await this._UserRepository.update(
        { _id: followingId },
        { $addToSet: { followers: userId } },
      );

     

      socket.emit('followSuccess', { followingId });
    } catch (error) {
      this.handleError(socket, error, 'followError');
    }
  }


  async updateChatSocketId(userId: string, socketId: string): Promise<void> {
    try {
      console.log(`🗨️ Updating chat socket ID for user234 ${userId}: ${socketId}`);
      await this._SessionUserRepository.updateChatSocketId(userId, socketId);
    } catch (error) {
      console.error(`❌ Failed to update chat socket ID for user ${userId}:`, error);
    }
  }

  private handleError(socket: Socket, error: unknown, event: string) {
    console.error(`❌ ${event} Error:`, error);
    socket.emit(event, {
      message: error instanceof Error ? error.message : 'Unknown error occurred.',
    });
  }
}
