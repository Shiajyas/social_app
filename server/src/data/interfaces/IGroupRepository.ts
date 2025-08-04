import { GroupDocument as Group } from "../../core/domain/interfaces/IGroups";

export interface IGroupRepository {
  create(data: Partial<Group>): Promise<Group>;
  findAll(): Promise<Group[]>;
  deleteById(id: string): Promise<void>;
  findByUserId(userId: string): Promise<Group[]>;
  updateById(id: string, data: Partial<Group>): Promise<Group>;
}
