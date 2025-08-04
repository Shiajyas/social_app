import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  fullname: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  role: string;
  gender?: string;
  mobile?: string;
  address?: string;
  bio?: string;
  saved?: mongoose.Types.ObjectId[];
  story?: string;
  website?: string;
  followers?: mongoose.Types.ObjectId[];
  following?: mongoose.Types.ObjectId[];
  subscription?: {
    isActive: boolean;
    startDate: Date | null;
    endDate: Date | null;
  };
  isSubscribed?: boolean;
  isBlocked: boolean;

  findFollowers(userId: string): Promise<IUser[]>;
  findFollowing(userId: string): Promise<IUser[]>;
}
