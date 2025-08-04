// services/socketServices/GroupSocketService.ts
import { Socket } from 'socket.io';
import { IGroupSocketService } from './Interface/IGroupSocketService';
import { IGroupRepository } from '../../../data/interfaces/IGroupRepository';
import { ISUserRepository } from '../../../data/interfaces/ISUserRepository';
import { INotificationService } from './Interface/InotificationService';
import { IGroupMessageRepository } from '../../../data/interfaces/IGroupMessageRepository';
import { IGroupMessage } from '../../../core/domain/interfaces/IGroupMessage';
import { MessageDTO } from '../../../core/domain/dto/IGroupMessageDTO';
export class GroupSocketService implements IGroupSocketService {
  constructor(
    private _GroupRepository: IGroupRepository,
    private _UserRepository: ISUserRepository,
    private _MessageRepository: IGroupMessageRepository,
    private _NotificationService : INotificationService
    
  ) {}
  async createGroup(socket: Socket, data: any, callback: Function): Promise<void> {
    try {
      const group = await this._GroupRepository.createGroup(data);
      socket.broadcast.emit('group-created', group);
      socket.emit('group-created', group);
      callback({ success: true, group });
    } catch (error: any) {
      callback({ success: false, message: error.message });
    }
  }

  async updateGroup(socket: Socket, data: any, callback: Function): Promise<void> {
    try {
      const updatedGroup = await this._GroupRepository.updateGroup(data.id, data);
      socket.broadcast.emit('group-updated', updatedGroup);
      socket.emit('group-updated', updatedGroup);
      callback({ success: true, group: updatedGroup });
    } catch (error: any) {
      callback({ success: false, message: error.message });
    }
  }

  async deleteGroup(socket: Socket, groupId: string, callback: Function): Promise<void> {
    try {
      await this._GroupRepository.deleteGroup(groupId);
      socket.broadcast.emit('group-deleted', groupId);
      socket.emit('group-deleted', groupId);
      callback({ success: true });
    } catch (error: any) {
      callback({ success: false, message: error.message });
    }
  }

  async joinGroup(socket: Socket, groupId: string, userId: string, callback: Function): Promise<void> {
    try {
       socket.join(groupId);
      socket.broadcast.emit('group-member-joined', { groupId, userId });
      callback({ success: true });
    } catch (error: any) {
      callback({ success: false, message: error.message });
    }
  }

  async leaveGroup(socket: Socket, groupId: string, userId: string, callback: Function): Promise<void> {
    try {
      await this._GroupRepository.removeMember(groupId, userId);
      socket.broadcast.emit('group-member-left', { groupId, userId });
      callback({ success: true });
    } catch (error: any) {
      callback({ success: false, message: error.message });
    }
  }

async addMember(
  socket: Socket,
  groupId: string,
  memberId: string,
  callback: Function
): Promise<void> {
  try {
    const result = await this._GroupRepository.addMember(groupId, memberId);

    if (!result.added) {
      socket.emit('error-in-addMember', {
        memberId,
        message: result.message || 'User already in group or invalid group',
      });
      callback({ success: false, message: result.message });
      return;
    }

    // ✅ Notify the sender that the member was added
    socket.emit('group-member-added', {
      groupId,
      userId: memberId,
      memberId, // explicitly send for frontend mapping
    });

    // ✅ Notify the added member
    await this._NotificationService.sendNotification(
      result.addedBy!,                 // senderId
      [memberId],                      // receiverIds
      'group-add',                     // type
      `You've been added to a group.`, // message
      undefined,                       // postId
      groupId,                         // groupId
      result.addedByName               // senderName
    );

    callback({ success: true, message: 'User added successfully' });

  } catch (error: any) {
    console.error('AddMember Error:', error);
    callback({
      success: false,
      message: error?.message || 'Something went wrong while adding user',
    });
  }
}



  async removeMember(socket: Socket, groupId: string, memberId: string, callback: Function): Promise<void> {
    try {
      console.log('Removing member from group:', groupId, memberId);
      await this._GroupRepository.removeMember(groupId, memberId);
      socket.emit('group-member-removed', { groupId, memberId });
      // callback({ success: true, message: 'User removed successfully' });
    } catch (error: any) {
      callback({ success: false, message: error.message });
    }
  }

async getGroupMembers(socket: Socket, groupId: string): Promise<void> {
  try {
    const members = await this._GroupRepository.getGroupMembers(groupId);
    console.log('Group Members:', members);
    // Emit directly to the requesting client
    socket.emit('group-members', { groupId, members });
  } catch (error: any) {
    socket.emit('error', { message: error.message });
  }
}

 async sendCommunityMessage(
    socket: Socket,
    groupId: string,
    message: {
      groupId: string;
      senderId: string;
      content: string;
      replyToMessageId?: string;
    },
    callback: (response: { success: boolean; message: string }) => void
  ): Promise<void> {
    try {
        // console.log('Sending message to group:', groupId, message);
      console.log
      const user = await this._UserRepository.findById(message.senderId);
      if (!user) throw new Error('Sender not found');

      const savedMessage = await this._MessageRepository.createMessage({
        groupId: message.groupId,
        senderId: message.senderId,
        content: message.content,
        replyToMessageId: message.replyToMessageId,
      });

      const populated = await this._MessageRepository.getMessageById(groupId, savedMessage._id);
      console.log('Populated message:', populated);
      console.log('Sending message to group:', groupId, populated);
     
      // socket.broadcast.emit('group-message',{groupId : groupId});
      socket.broadcast.emit('group-message',{groupId : groupId});
      socket.broadcast.emit('new-message', populated);
      callback({ success: true, message: 'Message sent' });
    } catch (error: any) {
      console.error('Error in sendCommunityMessage:', error);
      callback({ success: false, message: error.message || 'Failed to send message' });
    }
  }

  async receiveMessage(
    socket: Socket,
    groupId: string,
    message: IGroupMessage,
    callback: (response: { success: boolean; message: string }) => void
  ): Promise<void> {
    try {
      const fullMessage = await this._MessageRepository.getMessageById(groupId, message._id as string);
      if (!fullMessage) throw new Error('Message not found');

      socket.emit('new-message', fullMessage);

      callback({ success: true, message: 'Message received' });
    } catch (error: any) {
      console.error('Error in receiveMessage:', error);
      callback({ success: false, message: error.message || 'Failed to receive message' });
    }
  }

}
