import { ISUserRepository } from '../interfaces/ISUserRepository';
import { SUser } from '../../core/domain/interfaces/SUser';
import redis from '../../infrastructure/utils/redisClient';

const USER_SOCKET_SET = (userId: string) => `user:${userId}:sockets`;
const SOCKET_TO_USER_KEY = 'socket_to_user';
const ONLINE_USERS_KEY = 'online_users';

export class SUserRepositoryImpl implements ISUserRepository {
  async findById(id: string): Promise<SUser | undefined> {
    try {
      const userJson = await redis.hget(ONLINE_USERS_KEY, id);
      return userJson ? JSON.parse(userJson) : undefined;
    } catch (error) {
      console.error(`❌ Error finding user by ID ${id}:`, error);
      return undefined;
    }
  }

  async addUser(user: SUser): Promise<void> {
    try {
      // Add user metadata if not exists
      const existing = await this.findById(user.id);
      if (!existing) {
        await redis.hset(ONLINE_USERS_KEY, user.id, JSON.stringify({ id: user.id }));
      }

      // Add socket ID to user socket set
      await redis.sadd(USER_SOCKET_SET(user.id), user.socketId);
      await redis.hset(SOCKET_TO_USER_KEY, user.socketId, user.id);

      console.log(`✅ User socket added: ${user.id} (Socket ID: ${user.socketId})`);
    } catch (error) {
      console.error(`❌ Failed to add user socket ${user.id}:`, error);
    }
  }

  async updateChatSocketId(userId: string, chatSocketId: string): Promise<void> {
    try {
      const user = (await this.findById(userId)) || { id: userId };
      (user as SUser).chatSocketId = chatSocketId;

      await redis.hset(ONLINE_USERS_KEY, userId, JSON.stringify(user));
      await redis.hset(SOCKET_TO_USER_KEY, chatSocketId, userId);
      await redis.sadd(USER_SOCKET_SET(userId), chatSocketId);

      console.log(`🗨️ Chat socket ID updated for user ${userId}: ${chatSocketId}`);
    } catch (error) {
      console.error(`❌ Failed to update chat socket for ${userId}:`, error);
    }
  }

  async removeUser(socketId: string): Promise<void> {
    try {
      const userId = await redis.hget(SOCKET_TO_USER_KEY, socketId);
      if (!userId) {
        console.warn(`⚠️ No user found for Socket ID: ${socketId}`);
        return;
      }

      await redis.srem(USER_SOCKET_SET(userId), socketId);
      await redis.hdel(SOCKET_TO_USER_KEY, socketId);

      const remaining = await redis.scard(USER_SOCKET_SET(userId));
      if (remaining === 0) {
        await redis.hdel(ONLINE_USERS_KEY, userId);
        await redis.del(USER_SOCKET_SET(userId));
        console.log(`🗑️ All sockets removed, user ${userId} logged out.`);
      } else {
        console.log(`🗑️ Socket removed: ${socketId} (User: ${userId})`);
      }
    } catch (error) {
      console.error(`❌ Failed to remove user socket ${socketId}:`, error);
    }
  }

  async removeUserById(userId: string): Promise<void> {
    try {
      const sockets = await redis.smembers(USER_SOCKET_SET(userId));
      const pipeline = redis.multi();

      for (const sid of sockets) {
        pipeline.hdel(SOCKET_TO_USER_KEY, sid);
      }

      pipeline.del(USER_SOCKET_SET(userId));
      pipeline.hdel(ONLINE_USERS_KEY, userId);

      await pipeline.exec();
      console.log(`🗑️ User fully removed by ID: ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to remove user by ID ${userId}:`, error);
    }
  }

  async getActiveUsers(): Promise<SUser[]> {
    try {
      const map = await redis.hgetall(ONLINE_USERS_KEY);
      return Object.values(map).map((val) => JSON.parse(val));
    } catch (error) {
      console.error('❌ Failed to fetch active users:', error);
      return [];
    }
  }

  async getSocketIds(userId: string): Promise<string[]> {
    try {
      return await redis.smembers(USER_SOCKET_SET(userId));
    } catch (error) {
      console.error(`❌ Failed to get socket IDs for ${userId}:`, error);
      return [];
    }
  }

  async getActiveUserCount(): Promise<number> {
    try {
      return await redis.hlen(ONLINE_USERS_KEY);
    } catch (error) {
      console.error('❌ Failed to count active users:', error);
      return 0;
    }
  }

  async logActiveUsers(): Promise<{ userId: string; socketIds: string[] }[]> {
    try {
      const userIds = await redis.hkeys(ONLINE_USERS_KEY);
      const result = [];

      for (const id of userIds) {
        const socketIds = await this.getSocketIds(id);
        result.push({ userId: id, socketIds });
      }

      console.log('📋 Currently Active Users:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to log active users:', error);
      return [];
    }
  }
}
