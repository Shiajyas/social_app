import mongoose from 'mongoose';
import { IGroupRepository } from '../interfaces/IGroupRepository';
import GroupModel from '../../core/domain/models/Group';
import { GroupDocument as IGroup, Participant } from '../../core/domain/interfaces/IGroups';

export class GroupRepository implements IGroupRepository {
  async create(data: Partial<IGroup>): Promise<IGroup> {
    return await GroupModel.create(data);
  }

  async createGroup(data: Partial<IGroup>): Promise<IGroup> {
    return await GroupModel.create(data);
  }

  async updateGroup(id: string, data: Partial<IGroup>): Promise<IGroup> {
    const updatedGroup = await GroupModel.findByIdAndUpdate(id, data, { new: true });
    if (!updatedGroup) {
      throw new Error(`Group with ID ${id} not found`);
    }
    return updatedGroup;
  }

  async findAll(): Promise<IGroup[]> {
    return await GroupModel.find();
  }

  async deleteById(id: string): Promise<void> {
    await GroupModel.findByIdAndDelete(id);
  }

  async deleteGroup(id: string): Promise<void> {
    await GroupModel.findByIdAndDelete(id);
  }

  async addMember(
    groupId: string,
    memberId: string
  ): Promise<{
    added: boolean;
    message: string;
    addedBy?: string;
    addedByName?: string;
  }> {
    try {
      const group = await GroupModel.findById(groupId);
      if (!group) {
        return { added: false, message: `Group with ID ${groupId} not found` };
      }

      const memberIdStr = memberId.toString();
      const creatorIdStr = group.creatorId.toString();

      // Ensure creator is a participant
      const creatorIsMember = group.participants.some(
        (p) => p.userId.toString() === creatorIdStr
      );

      if (!creatorIsMember) {
        group.participants.push({
          userId: group.creatorId,
          role: 'admin',
          joinedAt: new Date(),
        });
      }

      // Prevent duplicate members
      const alreadyMember = group.participants.some(
        (p) => p.userId.toString() === memberIdStr
      );

      if (alreadyMember) {
        return {
          added: false,
          message: `User ${memberId} is already a participant`,
        };
      }

      // Add the new member
      group.participants.push({
        userId: new mongoose.Types.ObjectId(memberId),
        role: 'member',
        joinedAt: new Date(),
      });

      await group.save();

      // Get creator name
      const UserModel = mongoose.model('user'); // assuming registered elsewhere
      const creator = await UserModel.findById(group.creatorId).select('username');
      const addedByName = creator?.username || 'Someone';

      return {
        added: true,
        addedBy: group.creatorId.toString(),
        addedByName,
        message: `User ${memberId} added to group ${groupId}`,
      };
    } catch (error: any) {
      console.error(error);
      return {
        added: false,
        message: `Failed to add member to group: ${error.message}`,
      };
    }
  }

  async removeMember(
    groupId: string,
    memberId: string
  ): Promise<{ removed: boolean; message: string }> {
    try {
      const group = await GroupModel.findById(groupId);
      if (!group) return { removed: false, message: `Group not found` };

      const initialLength = group.participants.length;
      group.participants = group.participants.filter(
        (p) => p.userId.toString() !== memberId
      );

      if (group.participants.length === initialLength) {
        return { removed: false, message: `User ${memberId} not in group` };
      }

      await group.save();
      return { removed: true, message: `User ${memberId} removed from group` };
    } catch (error: any) {
      return { removed: false, message: `Error: ${error.message}` };
    }
  }

  async getGroupMembers(groupId: string): Promise<
    {
      _id: string;
      username: string;
      avatar?: string;
      role: 'admin' | 'member';
      joinedAt: Date;
    }[]
  > {
    try {
      const group = await GroupModel.findById(groupId).populate(
        'participants.userId',
        'username avatar'
      );

      if (!group) return [];

      return group.participants
        .filter((p: any) => p.userId) // Ensure user still exists
        .map((participant: any) => {
          const user = participant.userId;
          return {
            _id: user._id.toString(),
            username: user.username,
            avatar: user.avatar,
            role: participant.role,
            joinedAt: participant.joinedAt,
          };
        });
    } catch (error: any) {
      console.error('Error in getGroupMembers:', error.message);
      return [];
    }
  }
}
