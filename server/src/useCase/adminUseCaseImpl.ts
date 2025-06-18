import { IAdminUseCase } from './interfaces/IAdminUseCase';
import { IAdminRepository } from '../data/interfaces/IAdminRepository';
import { IAdmin } from '../core/domain/interfaces/IAdmin';
import bcrypt from 'bcryptjs';
import { createAccessToken, createRefreshToken } from '../infrastructure/utils/createTokens';
import { CreateAdminDTO } from '../core/domain/dto/CreateAdminDTO';

export class AdminUseCaseImpl implements IAdminUseCase {
  constructor(private readonly _adminRepo: IAdminRepository) {}

  async createAdmin(data: CreateAdminDTO): Promise<IAdmin> {
    const existing = await this._adminRepo.findByEmail(data.email);
    if (existing) throw new Error('Admin with this email already exists.');

    const hashedPassword = await bcrypt.hash(data.password, 10);

const newAdmin: Partial<IAdmin> = {
  email: data.email,
  roleName: data.roleName,
  hashedPassword,
  userName: data.userName,
  permissions: data.permissions,
  createdAt: new Date(),
};
    const created = await this._adminRepo.create(newAdmin as IAdmin);

    return {
      ...created,
      _id: created._id?.toString() || '', // Always convert to string
    };
  }

  async getAllAdmins(): Promise<IAdmin[]> {
    const admins = await this._adminRepo.getAll();
    return admins.map(admin => ({
      ...admin,
      _id: admin._id?.toString() || '', // Ensure _id is a string
    }));
  }

  async deleteAdmin(id: string): Promise<void> {
    return this._adminRepo.deleteById(id);
  }

  async updateAdmin(id: string, data: Partial<IAdmin>): Promise<IAdmin | null> {
    if (data.password) {
      data.hashedPassword = await bcrypt.hash(data.password, 10);
      delete (data as any).password;
    }
    const updated = await this._adminRepo.updateById(id, data);
    return updated ? { ...updated, _id: updated._id?.toString() || '' } : null;
  }

  async findByEmail(email: string): Promise<IAdmin | null> {
    const admin = await this._adminRepo.findByEmail(email);
    return admin ? { ...admin, _id: admin._id?.toString() || '' } : null;
  }

  async login(email: string, password: string): Promise<{
    token: string;
    refreshToken: string;
    user: IAdmin;
  }> {
    const admin = await this._adminRepo.findByEmail(email);
    console.log(admin, 'admin');
    if (!admin) throw new Error('Admin not found');

    const isValid = await bcrypt.compare(password, admin.hashedPassword);
    if (!isValid) throw new Error('Invalid credentials');

    const adminId = admin._id?.toString();
    console.log(adminId, 'adminId');
    if (!adminId) throw new Error('Admin ID is missing');

    const token = createAccessToken({
      id: adminId,
      role: 'admin',
      subscription: {
        isActive: false,
        startDate: null,
        endDate: null,
      },
    });

    const refreshToken = createRefreshToken({
      id: adminId,
      role: 'admin',
      subscription: {
        isActive: false,
        startDate: null,
        endDate: null,
      },
    });

    return {
      token,
      refreshToken,
      user: { ...admin, _id: adminId },
    };
  }

  getUserById(id: string): Promise<IAdmin | null> {
    console.log(id,"id");
    return this._adminRepo.findById(id);
  }
}
