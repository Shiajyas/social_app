import { Document, Types } from 'mongoose';

export interface ISubscription extends Document {
  userId: Types.ObjectId;   // subscribed user
  planId: Types.ObjectId;   // reference to the plan
  isSubscribed: boolean;    // active or not
  startDate: Date;
  endDate: Date;
}
