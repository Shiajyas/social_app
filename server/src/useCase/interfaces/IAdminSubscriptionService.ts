import { IPlan } from '../../core/domain/interfaces/IPlan';
import { ISubscription } from '../../core/domain/interfaces/ISubscription';
import { IPlanRepository } from '../../data/interfaces/IPlanRepo';
import { ISubscriptionRepository } from '../../data/interfaces/ISubscriptionRepository';

export interface QueryParams {
  search?: string;
  status?: 'active' | 'inactive';
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export interface AllQueryParams {
  search?: string;
  status?: 'active' | 'inactive';
  startDate?: string;
  endDate?: string;
}

export interface SubscriptionResult {
  subscriptions: Array<any>; // ideally DTO/lean doc
  total: number;
  page: number;
  hasMore: boolean;
}

export interface IAdminSubscriptionService {
  // ---- Plan Management ----
  createOrUpdatePlan(
    name: string,
    amount: number,
    duration: number,
    description: string,
    postId?: string
  ): Promise<IPlan>;

  getPlans(
    filters: any,
    page: number,
    limit: number
  ): Promise<SubscriptionResult>;

  getAllPlans(
    filters: any,
    page: number,
    limit: number
  ): Promise<SubscriptionResult>;

  togglePlanStatus(planId: string): Promise<{ message: string; isActive: boolean }>;

  // ---- Subscription Management ----
  assignSubscriptionToUser(
    userId: string,
    planId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ISubscription>;

  updateUserSubscription(
    userId: string,
    planId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ISubscription | null>;

  findUserSubscription(userId: string): Promise<ISubscription | null>;

  findAllUserSubscriptions(userId: string): Promise<ISubscription[]>;

  getSubscriptionPlans(): Promise<any>;
}
