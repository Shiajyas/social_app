  import { IAdminRepository } from '../interfaces/IAdminRepository';
  import { AdminModel } from '../../core/domain/models/AdminModel';
  import { IAdmin } from '../../core/domain/interfaces/IAdmin';

  import { AdminDTO } from '../../core/domain/dto/AdminDTO';
import { toAdminDTO } from '../../core/domain/dto/toAdminDTO';

export class AdminRepository implements IAdminRepository {
  // static findById(id: string) {
  //   throw new Error('Method not implemented.');
  // }
  async create(admin: IAdmin): Promise<AdminDTO> {
    const newAdmin = new AdminModel(admin);
    const saved = await newAdmin.save();
    return toAdminDTO(saved.toObject());
  }

  async findByEmail(email: string): Promise<AdminDTO | null> {
    const found = await AdminModel.findOne({ email }).lean();
    return found ? toAdminDTO(found) : null;
  }

  async findById(id: string): Promise<AdminDTO | null> {
    const found = await AdminModel.findById(id).lean();
    return found ? toAdminDTO(found) : null;
  }

  async getAll(): Promise<AdminDTO[]> {
    const results = await AdminModel.find().lean();
    return results.map(toAdminDTO);
  }

  async updateById(id: string, update: Partial<IAdmin>): Promise<AdminDTO | null> {
    const updated = await AdminModel.findByIdAndUpdate(id, update, { new: true }).lean();
    return updated ? toAdminDTO(updated) : null;
  }

  async deleteById(id: string): Promise<void> {
    await AdminModel.findByIdAndDelete(id);
  }
}
