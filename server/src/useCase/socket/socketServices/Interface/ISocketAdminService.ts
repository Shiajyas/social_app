
import { Socket } from 'socket.io';

export interface ISocketAdminService {
  registerAdmin(userId: string, socketId: string) : Promise<void>; 
  unregisterAdmin(socketId: string): void;
  getOverviewData(): Promise<any>;
  pushOverviewUpdate(): Promise<void>;
  sendOnlineUserCountTo(socket: Socket): Promise<void>;
  broadcastOnlineUserCountToAdmins(): Promise<void>;
  reportPost(postId: string, userId: string, reason: string): Promise<void>;
  dismissReport(reportId: string): Promise<void>;
  deletePost(postId: string): Promise<void>;
}
