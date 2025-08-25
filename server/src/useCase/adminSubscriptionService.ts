import { IPlan } from '../core/domain/interfaces/IPlan';
import { ISubscription } from '../core/domain/interfaces/ISubscription';
import { IPlanRepository } from '../data/interfaces/IPlanRepo';
import { ISubscriptionRepository } from '../data/interfaces/ISubscriptionRepository';
import { IAdminSubscriptionService } from './interfaces/IAdminSubscriptionService';

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
  subscriptions: Array<any>;
  total: number;
  page: number;
  hasMore: boolean;
}

export class AdminSubscriptionService  implements IAdminSubscriptionService {
  private _planRepo: IPlanRepository;
  private _subscriptionRepo: ISubscriptionRepository;

  constructor(planRepo: IPlanRepository, subscriptionRepo: ISubscriptionRepository) {
    this._planRepo = planRepo;
    this._subscriptionRepo = subscriptionRepo;
  }

  // ------------------ PLAN MANAGEMENT ------------------post
  async createOrUpdatePlan(
    name: string,
    amount: number,
    duration: number,
    description: string,
   planId?: string
  ): Promise<IPlan> {
    return await this._planRepo.createOrUpdatePlan(name, amount, duration, description,planId);
  }

  async getPlans(filters: any, page: number, limit: number): Promise<SubscriptionResult> {
    const skip = (page - 1) * limit;
    const { subscriptions, total } = await this._planRepo.getAllPlans(filters, skip, limit);

    return {
      subscriptions,
      total,
      page,
      hasMore: total > skip + subscriptions.length,
    };
  }

  async getAllPlans(filters: any, page: number, limit: number): Promise<SubscriptionResult> {
    return this.getPlans(filters, page, limit);
  }

  async togglePlanStatus(planId: string): Promise<{ message: string; isActive: boolean }> {
    const plan = await this._planRepo.togglePlanStatus(planId);
    return {
      message: 'Plan status updated',
      isActive: plan.isActive,
    };
  }

  // ------------------ USER SUBSCRIPTION MANAGEMENT ------------------
  async assignSubscriptionToUser(
    userId: string,
    planId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription> {
    return await this._subscriptionRepo.createSubscription(userId, planId, startDate, endDate);
  }

  async updateUserSubscription(
    userId: string,
    planId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription | null> {
    return await this._subscriptionRepo.updateSubscription(userId, planId, startDate, endDate);
  }

  async findUserSubscription(userId: string): Promise<ISubscription | null> {
    return await this._subscriptionRepo.findByUserId(userId);
  }

  async findAllUserSubscriptions(userId: string): Promise<ISubscription[]> {
    return await this._subscriptionRepo.findAllByUserId(userId);
  }

async getSubscriptionPlans(): Promise<ISubscription[]> {
    return await this._subscriptionRepo.findAll()
  }
}
