import { IAdmin } from "../../core/domain/interfaces/IAdmin";

export interface IAdminRepository {
  create(admin: IAdmin): Promise<IAdmin>;
  findByEmail(email: string): Promise<IAdmin | null>;
  getAll(): Promise<IAdmin[]>;
  updateById(id: string, update: Partial<IAdmin>): Promise<IAdmin | null>;
  deleteById(id: string): Promise<void>
  findById(id: string): Promise<IAdmin | null> 
}
