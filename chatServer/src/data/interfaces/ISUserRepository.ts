import { SUser } from '../../core/domain/interfaces/SUser';

export interface ISUserRepository {
  findById(id: string): Promise<SUser | undefined>;

  addUser(user: SUser): Promise<void>;

  updateChatSocketId(userId: string, chatSocketId: string): Promise<void>;

  removeUser(socketId: string): Promise<void>;

  removeUserById(userId: string): Promise<void>;

  getActiveUsers(): Promise<SUser[]>;

  getSocketIds(userId: string): Promise<string[]>;

  getActiveUserCount(): Promise<number>;

  logActiveUsers(): Promise<{ userId: string; socketIds: string[] }[]>;
}
