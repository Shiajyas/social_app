
import { IPermissions } from "../interfaces/IAdmin";

export interface AdminResponseDTO {
  _id: string;
  email: string;
  roleName: string;
  userName?: string;
  permissions: IPermissions;
  createdAt: string;
}
