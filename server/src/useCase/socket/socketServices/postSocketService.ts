import { Socket } from 'socket.io';
import { ObjectId } from 'mongodb';
import { IPostSocketService } from './Interface/IPostSocketService';
import { IPostRepository } from '../../../data/interfaces/IPostRepository';
import { IUserRepository } from '../../../data/interfaces/IUserRepository';
import { NotificationService } from '../../notificationServiceUsecase';
import { Server } from 'socket.io';
import { INotificationService } from '../../interfaces/InotificationService';

export class PostSocketService implements IPostSocketService {
  private _Io: Server;
  private _UserRepository: IUserRepository;
  private _PostRepository: IPostRepository;
  private _NotificationService:INotificationService

  constructor(
    ioInstance: Server,
    userRepo: IUserRepository,
    postRepo: IPostRepository,
    notificationService: NotificationService,
  ) {
    this._Io = ioInstance;
    this._UserRepository = userRepo;
    this._PostRepository = postRepo;
    this._NotificationService = notificationService;
  }

  async postUploaded(socket: Socket, userId: string, postId: string) {
    try {
      if (!userId || !postId)
        throw new Error('Invalid request. User ID and Post ID are required.');


      let owner = await this._UserRepository.findById(userId);
      if (!owner) throw new Error('User not found.');

      let followers = await this._UserRepository.findFollowers(userId);
      let following = await this._UserRepository.findFollowing(userId);

      let receiverIds = [...followers, ...following].map((user) =>
        user._id.toString(),
      );
      socket.broadcast.emit('postUpload', { postId });
      if (receiverIds.length) {
        const message = `${owner.fullname} has uploaded a new post.`;
        await this._NotificationService.sendNotification(
          userId,
          receiverIds,
          'post',
          message,
          postId,
          owner.username,
        );
      }
    } catch (error) {
      this.handleError(socket, error, 'postUploadError');
    }
  }

  async likePost(socket: Socket, userId: string, postId: string, type: string) {
    try {
      if (!userId || !postId)
        throw new Error('Invalid request. User ID and Post ID are required.');

      if (type === 'unlike') {
        await this._PostRepository.unlikePost(userId, postId);
      } else {
        await this._PostRepository.likePost(userId, postId);
      }
      const updatedPost = await this._PostRepository.getPost(postId);
      if (!updatedPost) throw new Error('Post not found or failed to update.');

      const likesArray = Array.isArray(updatedPost.likes)
        ? updatedPost.likes
        : [];

      this._Io.emit('update_like_count', { postId, likes: likesArray.length });
      socket.broadcast.emit('update_like_count', {
        postId,
        likes: likesArray.length,
      });

      const [postOwner, likePerson] = await Promise.all([
        this._UserRepository.findById(updatedPost.userId),
        this._UserRepository.findById(userId),
      ]);

      if (!postOwner || !likePerson) throw new Error('User not found.');

      if (postOwner._id.toString() !== userId) {
        const ownerMessage = `${likePerson.fullname} ${type === 'unlike' ? 'unliked' : 'liked'} your post.`;
        await this._NotificationService.sendNotification(
          userId,
          [postOwner._id.toString()],
          'like',
          ownerMessage,
          postId,
          postOwner.username,
        );
      }
    } catch (error) {
      this.handleError(socket, error, 'likeError');
    }
  }

  async addComment(
    socket: Socket,
    data: { userId: string; postId: string; content: string },
  ) {
    try {
      if (!data.userId || !data.postId || !data.content)
        throw new Error(
          'Invalid request. User ID, Post ID, and Content are required.',
        );

   
      const post = await this._PostRepository.getPost(data.postId);
      if (!post) throw new Error('Post not found.');

      const comment = {
        userId: new ObjectId(data.userId),
        content: data.content,
      };

      post.comments.push(comment as any);
      await post.save();

      socket.broadcast.emit('update_comment', {
        postId: data.postId,
        comments: post.comments,
      });

      const postOwner = await this._UserRepository.findById(post.userId);
      if (!postOwner) throw new Error('Post owner not found.');

      if (postOwner._id.toString() !== data.userId) {
        const ownerMessage = `${comment.userId} commented on your post.`;
        await this._NotificationService.sendNotification(
          data.userId,
          [postOwner._id.toString()],
          'comment',
          ownerMessage,
          data.postId,
          postOwner.username,
        );
      }
    } catch (error) {
      this.handleError(socket, error, 'commentError');
    }
  }

  async savePost(socket: Socket, postId: string, userId: string) {
    try {
      let res = await this._PostRepository.savePost(postId, userId);
 
      socket.emit('postSaved', { userId, saved: res });
    } catch (error) {
      this.handleError(socket, error, 'savePostError');
    }
  }

  async deletePost(socket: Socket, postId: string, userId: string) {
    try {
      let res = await this._PostRepository.deletePost(postId, userId);

      socket.emit('deletePost', { userId });
    } catch (error) {
      this.handleError(socket, error, 'savePostError');
    }
  }

  async getLikedUsers(socket: Socket, postId: string) {
    try {
      const likedUsers = await this._PostRepository.getLikedUsers(postId);
  
      socket.emit('likedUsersList', { postId: postId, users: likedUsers });
    } catch (error) {
      this.handleError(socket, error, 'likedUsersError');
    }
  }

  private handleError(socket: Socket, error: unknown, event: string) {
    console.error(
      `❌ ${event} Error:`,
      error instanceof Error ? error.message : error,
    );
    socket.emit(event, {
      message:
        error instanceof Error ? error.message : 'An unknown error occurred.',
    });
  }
}
