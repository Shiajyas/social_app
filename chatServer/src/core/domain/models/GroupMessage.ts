import mongoose, { Schema, Document } from 'mongoose';
import { IGroupMessage } from '../interfaces/IGroupMessage';

const GroupMessageSchema: Schema = new Schema({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  content: { type: String, required: true },
  mediaUrls: { type: [String], default: [] }, 
  timestamp: { type: Date, default: Date.now },
  replyTo: { type: Schema.Types.ObjectId, ref: 'GroupMessage' },
});

export default mongoose.model<IGroupMessage>('GroupMessage', GroupMessageSchema);