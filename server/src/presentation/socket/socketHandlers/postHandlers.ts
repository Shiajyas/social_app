import { Socket } from 'socket.io';
import { IPostSocketService } from '../../../useCase/socket/socketServices/Interface/IPostSocketService';

export class PostSocketHandler {
  private _socket: Socket;
  private _postService: IPostSocketService;

  constructor(socket: Socket, postService: IPostSocketService) {
    this._socket = socket;
    this._postService = postService;

    this.registerHandlers();
  }

  private registerHandlers() {
    this._socket.on('joinPostRoom', this.JOIN_POST_ROOM);
    this._socket.on('postUploaded', this.POST_UPLOADED);
    this._socket.on('like_post', this.LIKE_POST);
    this._socket.on('savePost', this.SAVE_POST);
    this._socket.on('deletePost', this.DELETE_POST);
    this._socket.on('getLikedUsers', this.GET_LIKED_USERS);
  }

  private JOIN_POST_ROOM = (postId: string) => {
    this._socket.join(postId);
    console.log(`[${this._socket.id}] joined post room: ${postId}`);
  };

  private POST_UPLOADED = async (data: { userId: string; postId: string }) => {
    await this._postService.postUploaded(this._socket, data.userId, data.postId);
  };

  private LIKE_POST = async (data: { userId: string; postId: string; type: string }) => {
    await this._postService.likePost(this._socket, data.userId, data.postId, data.type);
  };

  private SAVE_POST = async (data: { postId: string; userId: string }) => {
    console.log(data, '>>>>>>>>>>>>');
    try {
      await this._postService.savePost(this._socket, data.postId, data.userId);
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  private DELETE_POST = async (data: { postId: string; userId: string }) => {
    console.log(data, '>>>>>>>>>>>>');
    try {
      await this._postService.deletePost(this._socket, data.postId, data.userId);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  private GET_LIKED_USERS = async (data: { postId: string }) => {
    await this._postService.getLikedUsers(this._socket, data.postId);
  };
}
