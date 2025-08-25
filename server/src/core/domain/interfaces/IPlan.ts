

import { Document } from 'mongoose';

export interface IPlan extends Document {
  name: string;         // e.g. "Premium Plan"
  amount: number;       // price (e.g. 9.99)
  duration: number;     // duration in days/months
  description?: string; // optional description
  features: string[];   // list of features (like unlimited messaging, badge etc.)
  isActive: boolean;
}
