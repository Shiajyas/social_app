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
  private readonly subscriptionRepository: ISubscriptionRepository;

  constructor(subscriptionRepository: ISubscriptionRepository) {
    this.subscriptionRepository = subscriptionRepository;
  }

  async getUserSubscription(userId: string): Promise<ISubscription | null> {
    try {
      console.log('Fetching subscription for user:', userId);
      return await this.subscriptionRepository.findByUserId(userId);
    } catch (error) {
      console.error('Error fetching subscription:', error);
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
      return await this.subscriptionRepository.createSubscription(
        userId,
        planId,
        startDate,
        endDate,
      );
    } catch (error) {
      console.error('Error creating/updating subscription:', error);
      throw new Error('Failed to create/update subscription');
    }
  }

  async getUserSubscriptionHistory(userId: string): Promise<ISubscription[]> {
    try {
      console.log('Fetching all subscriptions for user:', userId);
      return await this.subscriptionRepository.findAllByUserId(userId);
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      throw new Error('Failed to fetch subscription history');
    }
  }

  async getPlanById(planId: string): Promise<IPlan| null> {
    try {
      return await this.subscriptionRepository.getPlanById(planId);
    } catch (error) {
      console.error('Error fetching plan:', error);
      throw new Error('Failed to fetch plan');
    }
  } 


  async getAllPlans(filters: any, page: number, limit: number): Promise<SubscriptionResult> {
  const { subscriptions, total } = await this.subscriptionRepository.getAllPlans(filters, page, limit);
  return {
    subscriptions,
    total,
    page,
    hasMore: total > page * limit,
  };
}
  
}

export default SubscriptionUseCase;
