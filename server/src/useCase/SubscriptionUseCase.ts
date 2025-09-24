import { ISubscriptionUseCase } from './interfaces/ISubscriptionUseCase';
import { ISubscription } from '../core/domain/interfaces/ISubscription';
import { ISubscriptionRepository } from '../data/interfaces/ISubscriptionRepository';
import { IPlan } from '../core/domain/interfaces/IPlan';

export interface SubscriptionResult {
  subscriptions: Array<any>;
  total: number;
  page: number;
  hasMore: boolean;
}

class SubscriptionUseCase implements ISubscriptionUseCase {
  private readonly _SubscriptionRepository: ISubscriptionRepository;

  constructor(subscriptionRepository: ISubscriptionRepository) {
    this._SubscriptionRepository = subscriptionRepository;
  }

  async getUserSubscription(userId: string): Promise<ISubscription | null> {
    try {
      return await this._SubscriptionRepository.findByUserId(userId);
    } catch {
      throw new Error('Failed to fetch subscription');
    }
  }

  async createOrUpdateSubscription(
    userId: string,
    planId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription> {
    try {
      return await this._SubscriptionRepository.createSubscription(
        userId,
        planId,
        startDate,
        endDate,
      );
    } catch {
      throw new Error('Failed to create/update subscription');
    }
  }

  async getUserSubscriptionHistory(userId: string): Promise<ISubscription[]> {
    try {
      return await this._SubscriptionRepository.findAllByUserId(userId);
    } catch {
      throw new Error('Failed to fetch subscription history');
    }
  }

  async getPlanById(planId: string): Promise<IPlan | null> {
    try {
      return await this._SubscriptionRepository.getPlanById(planId);
    } catch {
      throw new Error('Failed to fetch plan');
    }
  }

  async getAllPlans(
    filters: any,
    page: number,
    limit: number,
  ): Promise<SubscriptionResult> {
    try {
      const { subscriptions, total } =
        await this._SubscriptionRepository.getAllPlans(filters, page, limit);

      return {
        subscriptions,
        total,
        page,
        hasMore: total > page * limit,
      };
    } catch {
      throw new Error('Failed to fetch plans');
    }
  }
}

export default SubscriptionUseCase;
