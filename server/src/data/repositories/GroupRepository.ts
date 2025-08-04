// infrastructure/repositories/GroupRepository.ts
import { IGroupRepository } from "../interfaces/IGroupRepository";
import GroupModel from "../../core/domain/models/Group";
import { GroupDocument as Group } from "../../core/domain/interfaces/IGroups";
import mongoose from "mongoose";

export class GroupRepository implements IGroupRepository {
  async create(data: Partial<Group>): Promise<Group> {
    return await GroupModel.create(data);
  }

  async findAll(): Promise<Group[]> {
    return await GroupModel.find().populate('creatorId', 'username email').lean();
  }

  async deleteById(id: string): Promise<void> {
    await GroupModel.findByIdAndDelete(id);
  }


async findByUserId(userId: string): Promise<Group[]> {
  console.log("🔍 [GroupRepository] Finding groups for user:", userId);

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.warn("⚠️ Invalid userId passed to findByUserId:", userId);
    return [];
  }

  const objectUserId = new mongoose.Types.ObjectId(userId);

  const groups = await GroupModel.find({
    $or: [
      { creatorId: objectUserId },
      { 'participants.userId': objectUserId }
    ]
  })
    .populate('creatorId', 'username email')
    .populate('participants.userId', 'username email avatar')
    .sort({ updatedAt: -1 }) 

  return groups;
}



  async updateById(id: string, data: Partial<Group>): Promise<Group> {
try {
   let group = await GroupModel.findByIdAndUpdate(id, data, { new: true });
    console.log(group, 'groups');
   if (group) {
     return group;
   } else {
     throw new Error('Group not found');
  }
} catch (error) {
throw error;
}
  }

}
