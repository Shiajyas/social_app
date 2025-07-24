
export interface IPermissions {
  dashboard: boolean;
  subscription: boolean;
  spam: boolean;
  users: boolean;
  roleManagement: boolean;
}

export interface IAdmin {
  userName: string;
  id?: string;
  email: string;
  roleName: string;
  hashedPassword: string;
  permissions: IPermissions;
  createdAt: Date;
  password?: string;
}
