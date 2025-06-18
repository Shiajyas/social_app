import { AdminDTO } from './AdminDTO';

 export const toAdminDTO = (admin: any): AdminDTO => ({
  _id: admin._id.toString(),
  email: admin.email,
  roleName: admin.roleName,
  userName: admin.userName,
  hashedPassword: admin.hashedPassword,
  permissions: admin.permissions,
  createdAt: new Date(admin.createdAt),
});

// export default toAdminDTO;
