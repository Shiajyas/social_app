import { IPermissions } from "../interfaces/IAdmin";
export interface AdminDTO {
  _id: string;
  email: string;
  roleName: string;
  userName?: string;
  hashedPassword: string;
  permissions: IPermissions;
  createdAt: Date;
}
