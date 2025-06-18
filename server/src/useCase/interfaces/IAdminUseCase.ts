import { IAdmin } from '../../core/domain/interfaces/IAdmin';

export interface IAdminUseCase {
  createAdmin(data: {
    email: string;
    roleName: string;
    password: string;
    userName?: string;
    permissions: IAdmin['permissions'];
  }): Promise<IAdmin>;

  getAllAdmins(): Promise<IAdmin[]>;
  deleteAdmin(id: string): Promise<void>;
  updateAdmin(id: string, data: Partial<IAdmin>): Promise<IAdmin | null>;
  login(email: string, password: string): Promise<{
  token: string;
  refreshToken: string;
  user: IAdmin;
}> 
  getUserById(id: string): Promise<IAdmin | null>
}
