

import mongoose, { Schema, Model } from 'mongoose';
import { GroupDocument } from '../interfaces/IGroups';

const participantSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const groupSchema = new Schema<GroupDocument>(
  {
    name: { type: String, required: true },

     admins: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    description: String,
    coverImageUrl: String,
    iconUrl: String,
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    participants: [participantSchema],
    
  },
  { timestamps: true }
);

const Group: Model<GroupDocument> =
  mongoose.models.Group || mongoose.model<GroupDocument>('Group', groupSchema);

export default Group;
