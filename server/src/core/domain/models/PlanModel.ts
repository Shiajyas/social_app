
import mongoose, { Schema, Document } from 'mongoose';

import { IPlan } from '../interfaces/IPlan';
const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    duration: { type: Number, required: true }, // e.g. 30 days
    description: { type: String },
    features: [{ type: String }], // optional: list of perks
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IPlan>('Plan', PlanSchema);
