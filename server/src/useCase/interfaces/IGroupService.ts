

// domain/interfaces/IGroupService.ts
import { GroupDocument as Group } from "../../core/domain/interfaces/IGroups";
export interface IGroupService {
  createGroup(data: Partial<Group>): Promise<Group>;
  getGroups(): Promise<Group[]>;
  deleteGroup(id: string): Promise<void>;
  updateGroup(id: string, data: Partial<Group>): Promise<Group>;
  getUserGroups(userId: string): Promise<Group[]>;
}
