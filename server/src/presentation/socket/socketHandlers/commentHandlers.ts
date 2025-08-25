import { Socket } from 'socket.io';
import { ICommentSocketService } from '../../../useCase/socket/socketServices/Interface/ICommentSocketService';

export class CommentSocketHandler {
  private _socket: Socket;
  private _commentService: ICommentSocketService;

  constructor(socket: Socket, commentService: ICommentSocketService) {
    this._socket = socket;
    this._commentService = commentService;

    this.registerHandlers();
  }

  private registerHandlers() {
    this._socket.on('addComment', this.ADD_COMMENT);
    this._socket.on('deleteComment', this.DELETE_COMMENT);
    this._socket.on('likeComment', this.LIKE_COMMENT);
    this._socket.on('unLikeComment', this.UNLIKE_COMMENT);
  }

  private ADD_COMMENT = async (data: { userId: string; postId: string; content: string; parentId?: string }) => {
    try {
      console.log(`💬 Comment added by ${data.userId} on Post ID: ${data.postId}`);
      await this._commentService.addComment(this._socket, data);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  private DELETE_COMMENT = async (data: { commentId: string }) => {
    try {
      await this._commentService.deleteComment(this._socket, data?.commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  private LIKE_COMMENT = async (data: { userId: string; commentId: string }) => {
    try {
      const { userId, commentId } = data;
      await this._commentService.likeComment(this._socket, userId, commentId);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  private UNLIKE_COMMENT = async (data: { userId: string; commentId: string }) => {
    try {
      const { userId, commentId } = data;
      await this._commentService.unLikeComment(this._socket, userId, commentId);
    } catch (error) {
      console.error('Error unliking comment:', error);
    }
  };
}
