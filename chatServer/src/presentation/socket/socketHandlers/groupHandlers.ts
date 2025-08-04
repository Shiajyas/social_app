import { Socket } from 'socket.io';
import { IGroupSocketService } from '../../../useCase/socket/socketServices/Interface/IGroupSocketService';

export class GroupSocketHandler {
  constructor(private groupService: IGroupSocketService) {}

  public registerHandlers(socket: Socket) {
    socket.on('create-group', (data) => this.handle(socket, () => 
      this.groupService.createGroup(socket, data, this.emitIfError(socket))
    ));

    socket.on('update-group', (data) => this.handle(socket, () => 
      this.groupService.updateGroup(socket, data, this.emitIfError(socket))
    ));

    socket.on('delete-group', ({ groupId }) => this.handle(socket, () => 
      this.groupService.deleteGroup(socket, groupId, this.emitIfError(socket))
    ));

    socket.on('join-group', ({ groupId, userId }) => this.handle(socket, () => 
      this.groupService.joinGroup(socket, groupId, userId, this.emitIfError(socket))
    ));

    socket.on('leave-group', ({ groupId, userId }) => this.handle(socket, () => 
      this.groupService.leaveGroup(socket, groupId, userId, (response) => {
        if (response.success) {
          socket.emit('group-member-left', { groupId, userId });
        } else {
          socket.emit('error', { message: response.message });
        }
      })
    ));

    socket.on('add-group-member', ({ groupId, userId }) => this.handle(socket, () => 
      this.groupService.addMember(socket, groupId, userId, this.emitIfError(socket))
    ));

    socket.on('remove-group-member', ({ groupId, memberId }) => this.handle(socket, () => 
      this.groupService.removeMember(socket, groupId, memberId, this.emitIfError(socket))
    ));

    socket.on('get-group-members', ({ groupId }) => this.handle(socket, () => 
      this.groupService.getGroupMembers(socket, groupId)
    ));

    socket.on('sendCommunityMessage', ({ groupId, message }) => this.handle(socket, () => 
      this.groupService.sendCommunityMessage(socket, groupId, message, this.emitIfError(socket))
    ));

    socket.on('joinGroup', ({ groupId, userId }) => this.handle(socket, () => 
      this.groupService.joinGroup(socket, groupId, userId, this.emitIfError(socket))
    ));

    socket.on('leaveGroup', ({ groupId, userId }) => this.handle(socket, () => 
      this.groupService.leaveGroup(socket, groupId, userId, this.emitIfError(socket))
    ));

    socket.on('receiveMessage', ({ groupId, message }) => this.handle(socket, () => 
      this.groupService.receiveMessage(socket, groupId, message, this.emitIfError(socket))
    ));
  }

  private handle = async (socket: Socket, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (error) {
      console.error('Socket handler error:', error);
      socket.emit('error', { message: 'Server error occurred.' });
    }
  };

  private emitIfError = (socket: Socket) => (response: { success: boolean; message: string }) => {
    if (!response.success) {
      socket.emit('error', { message: response.message });
    }
  };
}
