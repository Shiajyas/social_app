

import mongoose from 'mongoose';

export interface Participant {
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface GroupDocument extends mongoose.Document {
  name: string;
  admins: mongoose.Types.ObjectId[];
  description?: string;
  coverImageUrl?: string;
  iconUrl?: string;
  creatorId: mongoose.Types.ObjectId;
  participants: Participant[];
  createdAt: Date;
  updatedAt: Date;
}
