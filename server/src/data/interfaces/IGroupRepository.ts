import { GroupDocument as Group } from "../../core/domain/interfaces/IGroups";

export interface IGroupRepository {
  create(data: Partial<Group>): Promise<Group>;
  createGroup(data: Partial<Group>): Promise<Group>;
  updateGroup(id: string, data: Partial<Group>): Promise<Group>;
  findAll(): Promise<Group[]>;
  deleteById(id: string): Promise<void>;
  deleteGroup(id: string): Promise<void>;

  addMember(groupId: string, memberId: string): Promise<{ added: boolean; addedBy?:string; message: string, addedByName?: string }>;
  removeMember(groupId: string, memberId: string): Promise<{ removed: boolean; message: string }>;
  getGroupMembers(groupId: string): Promise<
    {
      _id: string;
      username: string;
      avatar?: string;
      role: 'admin' | 'member';
      joinedAt: Date;
    }[]
  >

  findByUserId(userId: string): Promise<Group[]>;
  // findByName(name: string): Promise<Group | null>;
  updateById(userId: string, data: Partial<Group>): Promise<Group>;
  getGroupsByUserId(userId: string): Promise<Group[]>

}