import { Socket } from 'socket.io';
import { ICommentSocketService } from './Interface/ICommentSocketService';
import { ICommentRepository } from '../../../data/interfaces/ICommentRepository';
import { IUserRepository } from '../../../data/interfaces/IUserRepository';
import { NotificationService } from '../../notificationServiceUsecase';
import { INotificationService } from '../../interfaces/InotificationService';
import { IPostRepository } from '../../../data/interfaces/IPostRepository';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { IPost } from '../../../core/domain/interfaces/IPost';
import { IComment } from '../../../core/domain/interfaces/Icomment';

export class CommentSocketService implements ICommentSocketService {
  private _Io: Server;
  private _CommentRepository: ICommentRepository;
  private _UserRepository: IUserRepository;
  private _NotificationService: INotificationService;
  private _PostRepository: IPostRepository;

  constructor(
    ioInstance: Server,
    commentRepo: ICommentRepository,
    userRepo: IUserRepository,
    notificationService: NotificationService,
    postRepo: IPostRepository,
  ) {
    this._Io = ioInstance;
    this._CommentRepository = commentRepo;
    this._UserRepository = userRepo;
    this._NotificationService = notificationService;
    this._PostRepository = postRepo;
  }

  async addComment(
    socket: Socket,
    data: {
      userId: string;
      postId: string;
      content: string;
      parentId?: string;
    },
  ) {
    try {
      const { userId, postId, content, parentId } = data;


      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(postId)
      ) {
        throw new Error('Invalid User ID or Post ID.');
      }

      const parentCommentId =
        parentId && mongoose.Types.ObjectId.isValid(parentId)
          ? new mongoose.Types.ObjectId(parentId)
          : undefined;

const commentData = {
  userId: userId.toString(),
  postId: postId.toString(),
  content,
  parentCommentId: parentCommentId?.toString(),
};

      const newComment = await this._CommentRepository.addComment(commentData);
      if (parentCommentId) {
        await this._CommentRepository.addReply(parentCommentId, newComment._id);

        this._Io.emit('newReply', {
          postId,
          parentCommentId,
          reply: newComment,
        });

        // Notify parent comment owner
        const parentComment =
          await this._CommentRepository.findCommentById(parentId);
        if (parentComment && parentComment.userId?._id.toString() !== userId) {
          const commentAuthor = await this._UserRepository.findById(userId);
          if (!commentAuthor) throw new Error('User not found.');


          const message = `${commentAuthor.fullname} replied to your comment.`;
          await this._NotificationService.sendNotification(
            userId,
            [parentComment.userId._id.toString()],
            'replay',
            message,
            postId,
            commentAuthor.fullname,
          );
        }
      } else {
        this._Io.emit('newComment', { postId, comment: newComment });

        const postOwner: IPost | null =
          await this._PostRepository.getPost(postId);

        if (postOwner && postOwner.userId._id.toString() !== userId) {
          const commentAuthor = await this._UserRepository.findById(userId);
          if (!commentAuthor) throw new Error('User not found.');

          const message = `${commentAuthor.fullname} commented on your post.`;
          await this._NotificationService.sendNotification(
            userId,
            [postOwner.userId._id.toString()],
            'comment',
            message,
            postId.toString(),
            commentAuthor.fullname,
          );
        }
      }
    } catch (error) {
      this.handleError(socket, error, 'commentError');
    }
  }

  async deleteComment(socket: Socket, commentId: string) {
 
    try {
      if (!commentId)
        throw new Error('Invalid request. Comment ID is required.');

      const res = await this._CommentRepository.getCommentDetails(commentId);

      const deleted = await this._CommentRepository.deleteComment(commentId);
      if (!deleted) throw new Error('Failed to delete comment.');

      let parentId = res?.parentCommentId;
      let postId = res?.postId;

      if (parentId) {
   
        this._Io.emit('delete_reply', { commentId, postId, parentId });
      } else {
     
        this._Io.emit('delete_comment', { commentId, postId });
      }
    } catch (error) {
      this.handleError(socket, error, 'deleteCommentError');
    }
  }

  async likeComment(socket: Socket, userId: string, commentId: string) {
    try {
   

      if (!userId || !commentId)
        throw new Error(
          'Invalid request. User ID and Comment ID are required.',
        );

      // Add the like
      const updatedComment = await this._CommentRepository.likeComment(
        commentId,
        userId,
      );
      if (!updatedComment) throw new Error('Failed to like comment.');

      // Debugging Log

      // Emit to all users (including sender)
      const likesArray = Array.isArray(updatedComment.likes)
        ? updatedComment.likes
        : [];
      this._Io.emit('commentLiked', { commentId, likes: updatedComment.likes });

      // Retrieve the comment to get the owner userId
      const comment = await this._CommentRepository.findCommentById(commentId);
      if (!comment) throw new Error('Comment not found.');

      // Notify the comment owner
      const commentOwner = await this._UserRepository.findById(comment.userId);
      if (!commentOwner) throw new Error('Comment owner not found.');

      if (commentOwner._id.toString() !== userId) {
        const message = `${commentOwner.fullname} liked your comment.`;
        await this._NotificationService.sendNotification(
          userId,
          [commentOwner._id.toString()],
          'like',
          message,
          commentId,
          commentOwner.fullname,
        );
      }
    } catch (error) {
      this.handleError(socket, error, 'likeCommentError');
    }
  }

  async unLikeComment(socket: Socket, userId: string, commentId: string) {
    try {

      if (!userId || !commentId)
        throw new Error(
          'Invalid request. User ID and Comment ID are required.',
        );

      // Remove the like
      const updatedComment = await this._CommentRepository.unLikeComment(
        commentId,
        userId,
      );
      if (!updatedComment) throw new Error('Failed to unlike comment.');

      // Emit the updated likes count
      this._Io.emit('commentLiked', {
        commentId,
        likes: updatedComment.likes || [],
      });
    } catch (error) {

      this.handleError(socket, error, 'unLikeCommentError');
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
