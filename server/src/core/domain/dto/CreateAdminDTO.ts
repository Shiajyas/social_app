
import { IPermissions } from "../interfaces/IAdmin";
export interface CreateAdminDTO {
  email: string;
  roleName: string;
  password: string;
  userName?: string;
  permissions: IPermissions;
}
