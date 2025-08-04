import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupMessage extends Document {
  groupId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  mediaUrls: string[];  
  timestamp: Date;
  replyTo?: mongoose.Types.ObjectId;
}

