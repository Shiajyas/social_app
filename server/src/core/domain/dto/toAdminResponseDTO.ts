
import { IAdmin } from "../interfaces/IAdmin";
import { AdminResponseDTO } from "./AdminResponseDTO";

export const toAdminResponseDTO = (admin: IAdmin): AdminResponseDTO => ({
    _id:  admin._id.toString(),
    email: admin.email,
    roleName: admin.roleName,
    userName: admin.userName,
    permissions: admin.permissions,
    createdAt: admin.createdAt.toISOString(),
});
