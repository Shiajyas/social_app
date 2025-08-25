  import mongoose, { Schema, Document, Types } from 'mongoose';

  export interface ISubscription extends Document {
    userId: Types.ObjectId;
    planId: Types.ObjectId; // Reference to Plan
    isSubscribed: boolean;
    startDate: Date;
    endDate: Date;
  }

  const SubscriptionSchema = new Schema<ISubscription>(
    {
      userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
      planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
      isSubscribed: { type: Boolean, default: true },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
    },
    { timestamps: true }
  );

  export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
