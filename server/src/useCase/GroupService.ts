// application/services/GroupService.ts

import { IGroupService } from './interfaces/IGroupService';
import { IGroupRepository } from '../data/interfaces/IGroupRepository';
import { GroupDocument as Group } from '../core/domain/interfaces/IGroups';
import { Server as SocketServer } from 'socket.io';

import { IGroupMessageRepository } from '../data/interfaces/IGroupMessageRepository';
import { IGroupMessage } from '../core/domain/interfaces/IGroupMessage';
import { MessageDTO } from '../core/domain/dto/IGroupMessageDTO';

export class GroupService implements IGroupService {
  private readonly _Io: SocketServer;
  private readonly _GroupRepository: IGroupRepository;
   private _MessageRepository: IGroupMessageRepository;
  constructor(groupRepository: IGroupRepository,messageRepository: IGroupMessageRepository, io: SocketServer) {
    this._GroupRepository = groupRepository;
    this._MessageRepository = messageRepository
    this._Io = io; // ✅ Assign the injected socket instance here
  }

  async createGroup(data: Partial<Group>): Promise<Group> {
    try {
      const group = await this._GroupRepository.create(data);
      this._Io.emit('group-created', { group }); // ✅ Safe to emit
      return group;
    } catch (error) {
      throw error;
    }
  }

  async getGroups(): Promise<Group[]> {
    return await this._GroupRepository.findAll();
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    return await this._GroupRepository.findByUserId(userId);
  }

  async deleteGroup(id: string): Promise<void> {
    await this._GroupRepository.deleteById(id);
    this._Io.emit('group-deleted', { groupId: id });
  }

  async updateGroup(id: string, data: Partial<Group>): Promise<Group> {
    const updatedGroup = await this._GroupRepository.updateById(id, data);
    this._Io.emit('group-updated', { group: updatedGroup });
    return updatedGroup;
  }

  async notifyGroupActivity(groupId: string): Promise<void> {
    this._Io.emit('group-message', { groupId });
  }

async getGroupMessages(groupId: string, limit: number = 20): Promise<MessageDTO[]> {
  try {
    const messages = await this._MessageRepository.getRecentMessages(groupId, limit);
    console.log(messages, 'messages>>>>>>>>>>>>>>><<<<<<<<<<<<');
    return messages;
  } catch (error) {
    console.error('Failed to fetch group messages:', error);
    throw error;
  }
}

}
