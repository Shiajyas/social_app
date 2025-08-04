import { Socket } from 'socket.io';
import { IGroupMessage } from '../../../../core/domain/interfaces/IGroupMessage';

export interface IGroupSocketService {
  createGroup(socket: Socket, data: any, callback: (response: any) => void): Promise<void>;
  updateGroup(socket: Socket, data: any, callback: (response: any) => void): Promise<void>;
  deleteGroup(socket: Socket, groupId: string, callback: (response: any) => void): Promise<void>;
  joinGroup(socket: Socket, groupId: string, userId: string, callback: (response: any) => void): Promise<void>;
  leaveGroup(socket: Socket, groupId: string, userId: string, callback: (response: any) => void): Promise<void>;
  addMember(socket: Socket, groupId: string, memberId: string, callback: (response: any) => void): Promise<void>;
  removeMember(socket: Socket, groupId: string, memberId: string, callback: (response: any) => void): Promise<void>;
  getGroupMembers(socket: Socket, groupId: string): Promise<void> 
    receiveMessage(
    socket: Socket,
    groupId: string,
    message: IGroupMessage,
    callback: (response: { success: boolean; message: string }) => void
  ): Promise<void>;

  sendCommunityMessage(
    socket: Socket,
    groupId: string,
    message: {
      senderId: string;
      content: string;
      replyToMessageId?: string;
      mediaUrls?: string[];
    },
    callback: (response: { success: boolean; message: string }) => void
  ): Promise<void>;

}
