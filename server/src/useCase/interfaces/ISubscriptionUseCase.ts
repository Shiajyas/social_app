import { IPlan } from '../../core/domain/interfaces/IPlan';
import { ISubscription } from '../../core/domain/interfaces/ISubscription';
import { SubscriptionResult } from '../adminSubscriptionUsecase';

export interface ISubscriptionUseCase {
  getUserSubscription(userId: string): Promise<ISubscription | null>;
  createOrUpdateSubscription(
    userId: any,
    planId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription>;
  getUserSubscriptionHistory(userId: string): Promise<ISubscription[]>;
   getPlanById(planId: string): Promise<IPlan | null> 
getAllPlans(filters: any, page: number, limit: number): Promise<SubscriptionResult> 
}
