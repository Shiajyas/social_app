import { Types } from 'mongoose';
import SubscriptionModel from '../../core/domain/models/SubscriptionModel';// Adjust path based on actual export
import User from '../../core/domain/models/UserModel';

export interface QueryParams {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

export interface AllQueryParams {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface SubscriptionResult {
  subscriptions: Array<any>; // Ideally use a DTO or lean document type here
  total: number;
  page: number;
  hasMore: boolean;
}

export interface IAdminSubscriptionService {
  getSubscriptions(params: QueryParams): Promise<SubscriptionResult>;

  getAllSubscriptions(params: AllQueryParams): Promise<{
    subscriptions: Array<any>; // Or use a `SubscriptionDTO` if you want a stricter structure
  }>;

  toggleSubscriptionStatus(subscriptionId: string): Promise<{
    message: string;
    isSubscribed: boolean;
  }>;
}
