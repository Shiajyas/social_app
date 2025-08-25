import { IUser } from '../../core/domain/interfaces/IUser';
import { IPost } from '../../core/domain/interfaces/IPost';
import { ICallHistory } from '../../core/domain/interfaces/ICallHistory';

export interface IUserService {
  getSuggestions(userId: string): Promise<IUser[]>;
  getFollowers(userId: string): Promise<IUser[]>;
  getFollowing(userId: string): Promise<IUser[]>;
  unfollowUser(userId: string, targetUserId: string): Promise<void>;
  getProfile(userId: string): Promise<IUser | null>;
  getUserPost(userId: string): Promise<IPost[]>;
  updateUserProfile(userId: string, updatedData: Partial<IUser>): Promise<IUser | null>;
  getUserSavedPost(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: IPost[]; nextPage: number | null }>;
  searchUsers(query: string): Promise<IUser[] | any>;
  getCallHistory(userId: string): Promise<ICallHistory[]> 
  changePassword(userId: string,oldPassword: string, newPassword: string): Promise<boolean>
}
