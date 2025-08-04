import { IPostService } from './interfaces/IPostService';
import { IPostRepository } from '../data/interfaces/IPostRepository';
import { IUserRepository } from '../data/interfaces/IUserRepository';
import { ISubscriptionRepository } from '../data/interfaces/ISubscriptionRepository';
import { generateHashtagsFree } from '../infrastructure/utils/openAi';
import { IPost } from '../core/domain/interfaces/IPost';
import {analyzeSentiment} from '../infrastructure/utils/moderation';

export class PostService implements IPostService {
  private _PostRepository: IPostRepository;
  private _UserRepository!: IUserRepository;
  private _SubscriptionRepo!: ISubscriptionRepository 

  constructor(postRepository: IPostRepository, userRepository: IUserRepository, subscriptionRepo:  ISubscriptionRepository) {
    this._PostRepository = postRepository,
    this._UserRepository= userRepository,
    this._SubscriptionRepo = subscriptionRepo
  }

  // Create a new post
async createPost(
  userId: string,
  title: string,
  description: string,
  mediaUrls: string[],
  visibility: 'public' | 'private',
  hashtags: string[]
): Promise<IPost> {
  const user = await this._UserRepository.findById(userId); // You should have this method
  if (!user) throw new Error('User not found');

  const isSubscribed = await this._SubscriptionRepo.findByUserId(userId)

  // console.log(isSubscribed,">>>>>>>>>>")

  const isToxicResult = await analyzeSentiment(`${title} ${description}`);
 console.log("isToxicResult",isToxicResult);
 
const THRESHOLD = 0.041

const isToxic = isToxicResult.some((inner: any[]) =>
  inner.some((item: any) => item.label === 'negative' && item.score > THRESHOLD)
);
console.log("Is toxic:", isToxic); 
  
    if (isToxic) {
      throw new Error('Post contains toxic content and cannot be created');
    }

  // Regular user logic: check post count
  if (!isSubscribed) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayPostCount = await this._PostRepository.countUserPostsInRange(userId, today, tomorrow);
    if (todayPostCount >= 3) {
      throw new Error('Daily post limit reached. Upgrade to Pro for unlimited posts.');
    }
  }

  return await this._PostRepository.createPost(
    userId,
    title,
    description,
    mediaUrls,
    visibility,
    hashtags
  );
}


  async getPosts(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: IPost[]; nextPage: number | null }> {
    // console.log(userId, page, limit, ">>>>userId 2*");
    let { posts, nextPage } = await this._PostRepository.getPosts(
      userId,
      page,
      limit,
    );
    // console.log(posts, ">>>>posts 2*");

    return { posts, nextPage };
  }

  // Retrieve a single post by ID
  async getPost(postId: string): Promise<IPost | null> {
    return await this._PostRepository.getPost(postId);
  }

  // Update a post
  async updatePost(
    postId: string,
    userId: string,
    title: string,
    description: string,
    mediaUrls: string[],
    hashtags: string[]
  ): Promise<IPost> {
    // console.log(hashtags,">>>>>");
    
    const updatedPost = await this._PostRepository.updatePost(
      postId,
      userId,
      title,
      description,
      mediaUrls,
      hashtags
    );

    if (!updatedPost) {
      throw new Error('Post not found or could not be updated');
    }

    return updatedPost;
  }

  // Delete a post
  async deletePost(userId: string, postId: string): Promise<void> {
    await this._PostRepository.deletePost(userId, postId);
  }

  // Like a post
  async likePost(userId: string, postId: string): Promise<void> {
    await this._PostRepository.likePost(userId, postId);
    const post = await this._PostRepository.getPost(postId);
    console.log('likre >>>');
    if (!post) throw new Error('Post not found');
  }

  // Unlike a post
  async unlikePost(userId: string, postId: string): Promise<void> {
    await this._PostRepository.unlikePost(userId, postId);
    const post = await this._PostRepository.getPost(postId);
    console.log('unlikre >>>');
    if (!post) throw new Error('Post not found');
  }

  // Get posts by a specific user
  async getUserPosts(
    userId: string,
    page: number,
    limit: number,
  ): Promise<IPost[]> {
    return await this._PostRepository.getUserPosts(userId, page, limit);
  }

  // Report a post
  async reportPost(userId: string, postId: string): Promise<void> {
    await this._PostRepository.reportPost(userId, postId);
  }

  async generateHashtagsFromAI(
    description: string,
    userId: string
  ): Promise<string[]> {
    const user = await this._UserRepository.findById(userId);
    if (!user) throw new Error('User not found');

    // Subscription check
    // if (!user.subscription?.isActive || user.role !== 'proUser') {
    //   throw new Error('This is a paid feature. Subscribe to access.');
    // }

      const isSubscribed = await this._SubscriptionRepo.findByUserId(userId)
    if (!isSubscribed) {
      throw new Error('This is a paid feature. Subscribe to access.');
    }

    return await generateHashtagsFree(description);
  }

  async searchPostsByHashtags(
    query: string,
  ): Promise<IPost[]> {
    return await this._PostRepository.searchPostsByHashtags(query);
  }

}
