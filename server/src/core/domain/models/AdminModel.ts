import mongoose, { Schema, Document } from 'mongoose';
import { IPermissions } from '../interfaces/IAdmin';

export interface AdminDocument extends Document {
  email: string;
  roleName: string;
  hashedPassword: string;
  permissions: IPermissions;
  createdAt: Date;
}

const AdminSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  roleName: { type: String, required: true },
  userName: { type: String, unique: true },
  hashedPassword: { type: String, required: true },
  permissions: {
    dashboard: { type: Boolean, default: true },
    subscription: { type: Boolean, default: false },
    spam: { type: Boolean, default: false },
    users: { type: Boolean, default: false },
    roleManagement: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
});

export const AdminModel = mongoose.model<AdminDocument>('Admin', AdminSchema);
