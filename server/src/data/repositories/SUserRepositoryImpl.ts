import { ISUserRepository } from '../interfaces/ISUserRepository';
import { SUser } from '../../core/domain/interfaces/SUser';
import redis from '../../infrastructure/utils/redisClient';

const ONLINE_USERS_KEY = 'online_users';         // Hash: userId -> user metadata (without socketId)
const SOCKET_TO_USER_KEY = 'socket_to_user';     // Hash: socketId -> userId

const USER_SOCKET_SET = (userId: string) => `user:${userId}:sockets`;  // Set of socketIds per user

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
      // Clean previous mapping of this socketId, if any
      await this.removeUser(user.socketId);

      // Add or update user metadata (without socketId)
      const existing = await this.findById(user.id);
      if (!existing) {
        // Store minimal user metadata
        await redis.hset(ONLINE_USERS_KEY, user.id, JSON.stringify({ id: user.id }));
      }

      // Add socketId to user's socket set
      await redis.sadd(USER_SOCKET_SET(user.id), user.socketId);

      // Map socketId to userId
      await redis.hset(SOCKET_TO_USER_KEY, user.socketId, user.id);

      console.log(`✅ User socket added: ${user.id} (Socket ID: ${user.socketId})`);
    } catch (error) {
      console.error(`❌ Failed to add user socket ${user.id}:`, error);
    }
  }

  async updateChatSocketId(userId: string, chatSocketId: string): Promise<void> {
    try {
      const userJson = await redis.hget(ONLINE_USERS_KEY, userId);
      const user: SUser = userJson ? JSON.parse(userJson) : { id: userId };

      user.chatSocketId = chatSocketId;

      await redis.hset(ONLINE_USERS_KEY, userId, JSON.stringify(user));
      await redis.hset(SOCKET_TO_USER_KEY, chatSocketId, userId);
      await redis.sadd(USER_SOCKET_SET(userId), chatSocketId);

      console.log(`🗨️ Chat socket ID updated for user ${userId}: ${chatSocketId}`);
    } catch (error) {
      console.error(`❌ Failed to update chatSocketId for user ${userId}:`, error);
    }
  }

  async removeUser(socketId: string): Promise<void> {
    try {
      const userId = await redis.hget(SOCKET_TO_USER_KEY, socketId);
      if (!userId) {
        console.warn(`⚠️ No user found for Socket ID: ${socketId}`);
        return;
      }

      // Remove socketId from user's socket set
      await redis.srem(USER_SOCKET_SET(userId), socketId);

      // Remove socketId mapping
      await redis.hdel(SOCKET_TO_USER_KEY, socketId);

      // Check if user has any sockets left
      const remaining = await redis.scard(USER_SOCKET_SET(userId));

      if (remaining === 0) {
        // No sockets left, remove user metadata and socket set
        await redis.hdel(ONLINE_USERS_KEY, userId);
        await redis.del(USER_SOCKET_SET(userId));
        console.log(`🗑️ All sockets removed, user ${userId} logged out.`);
      } else {
        console.log(`🗑️ Socket removed: ${socketId} (User: ${userId}), remaining sockets: ${remaining}`);
      }
    } catch (error) {
      console.error(`❌ Failed to remove user by socket ID ${socketId}:`, error);
    }
  }


async getSocketIds(userId: string): Promise<string[]> {
  return await redis.smembers(USER_SOCKET_SET(userId));
}

  async removeUserById(userId: string): Promise<void> {
    try {
      // Get all sockets for user
      const sockets = await redis.smembers(USER_SOCKET_SET(userId));

      if (sockets.length === 0) {
        console.warn(`⚠️ No sockets found for user ID: ${userId}`);
        return;
      }

      const pipeline = redis.multi();

      // Remove socketId -> userId mapping for all sockets
      for (const sid of sockets) {
        pipeline.hdel(SOCKET_TO_USER_KEY, sid);
      }

      // Remove user's socket set and user metadata
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
      const userMap = await redis.hgetall(ONLINE_USERS_KEY);
      const users: SUser[] = [];

      for (const [userId, json] of Object.entries(userMap)) {
        try {
          const user = JSON.parse(json);
          // Get all socket IDs for user
          const sockets = await redis.smembers(USER_SOCKET_SET(userId));
          users.push({ ...user, sockets });
        } catch {
          // ignore parse errors
        }
      }

      console.log(`📡 Active Users [${users.length}]:`, users);
      return users;
    } catch (error) {
      console.error('❌ Failed to fetch active users:', error);
      return [];
    }
  }

  async getActiveUserCount(): Promise<number> {
    try {
      const count = await redis.hlen(ONLINE_USERS_KEY);
      console.log('📡 Active User Count:', count);
      return count;
    } catch (error) {
      console.error('❌ Failed to get active user count:', error);
      return 0;
    }
  }
async logActiveUsers(): Promise<{ userId: string; socketId: string }[]> {
  try {
    const users = await this.getActiveUsers();
 const active = users.filter((u) => (u.sockets ?? []).length > 0).map((u) => ({ userId: u.id, socketId: (u.sockets ?? [])[0] }));
    console.log('📋 Currently Active Users:', active);
    return active;
  } catch (error) {
    console.error('❌ Failed to log active users:', error);
    return [];
  }
}
}
