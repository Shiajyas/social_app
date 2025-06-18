export interface IPermissions {
  dashboard: boolean;
  subscription: boolean;
  spam: boolean;
  users: boolean;
  roleManagement: boolean;
}

import { Types } from 'mongoose';

export interface IAdmin {
  _id: Types.ObjectId | string;
  email: string;
  password?: string;
  hashedPassword: string;
  roleName: string;
  userName?: string;
  permissions: IPermissions;
  createdAt: Date;
}
