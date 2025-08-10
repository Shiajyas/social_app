import { IUserService } from './interfaces/IUserService';
import { IUserRepository } from '../data/interfaces/IUserRepository';
import { IUser } from '../core/domain/interfaces/IUser';
import { IPostRepository } from '../data/interfaces/IPostRepository';
import { IPost } from '../core/domain/interfaces/IPost';
import { ICallHistoryRepository } from '../data/interfaces/ICallHistoryRepository';
import { ICallHistory } from '../core/domain/interfaces/ICallHistory';
import bcrypt from 'bcryptjs';
export class UserService implements IUserService {
  private _UserRepository: IUserRepository;
  private _PostRepository: IPostRepository;
  private _CallHistoryRepository: ICallHistoryRepository

  constructor(
    userRepository: IUserRepository,
    postRepository: IPostRepository,
    callHistoryRepository: ICallHistoryRepository
  ) {
    this._UserRepository = userRepository;
    this._PostRepository = postRepository;
    this._CallHistoryRepository = callHistoryRepository
  }

  async getSuggestions(userId: string): Promise<IUser[]> {    
    const currentUser = await this._UserRepository.findById(userId);     
    if (!currentUser) {
      throw new Error('User not found');
    }     
    const excludedUserIds = [
      ...(currentUser.following || []),         
      ...(currentUser.followers || []),   
      userId,    
    ];
    return this._UserRepository.find({ _id: { $nin: excludedUserIds } });   
  }           

  async getFollowers(userId: string): Promise<IUser[]> {
    return this._UserRepository.findFollowers(userId);
  } 

  async getFollowing(userId: string): Promise<IUser[]> {
    return this._UserRepository.findFollowing(userId);
  }

  async unfollowUser(userId: string, targetUserId: string): Promise<void> {
    await this._UserRepository.unfollow(userId, targetUserId);
  }

  async getProfile(userId: string): Promise<IUser | null> {
    return this._UserRepository.findById(userId);
  }

  async getUserPost(userId: string): Promise<any> {
    return this._PostRepository.getUserPosts(userId, 1, 50);
  }

  async updateUserProfile(
    userId: string,
    updatedData: any,
  ): Promise<IUser | null> {
    try {
      const updatedUser = await this._UserRepository.updateUserById(
        userId,
        updatedData,
      );

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  async getUserSavedPost(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: IPost[]; nextPage: number | null }> {
    // console.log(userId, page, limit, ">>>>userId 2*");
    let { posts, nextPage } = await this._PostRepository.getSavedPosts(
      userId,
      page,
      limit,
    );
    // console.log(posts, ">>>>posts 2*");

    return { posts, nextPage };
  }

  async searchUsers(
    query: string,
  ): Promise<{ users: IUser[]; posts: IPost[] }> {
    console.log(query, 'searchquery 2');
    const users = await this._UserRepository.searchUsers(query);
    const posts = await this._PostRepository.searchPosts(query);

    console.log(users, posts, 'users and posts');

    return { users, posts };
  }

  async changePassword(userId: string,oldPassword: string, newPassword: string):Promise<boolean> {

   try {
         const hashedPassword = await bcrypt.hash(newPassword, 12);
     console.log(hashedPassword, 'hashedPassword');
   let res = await this._UserRepository.changePassword(userId,oldPassword, hashedPassword);
    if(res){
      return true
    }else{
      return false
    }
   } catch (error) {
    throw error;
    
   }  
  }

  getCallHistory(userId: string): Promise<ICallHistory[]> {
    return this._CallHistoryRepository.getUserCallHistory(userId);
  }
}
