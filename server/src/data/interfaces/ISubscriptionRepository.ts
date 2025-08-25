import { IPlan } from '../../core/domain/interfaces/IPlan';
import { ISubscription } from '../../core/domain/interfaces/ISubscription';

export interface ISubscriptionRepository {
  findByUserId(userId: any): Promise<ISubscription | null>;
  createSubscription(
    userId: string,
       planId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription>;
  updateSubscription(
    userId: string,
       planId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription | null>;
  findAllByUserId(userId: string): Promise<ISubscription[]>;
  findAll(): Promise<ISubscription[]>
  getPlanById(planId: string): Promise<IPlan| null>
getAllPlans(
    filters: any,
    skip: number,
    limit: number
  ): Promise<{ subscriptions: IPlan[]; total: number }>
}
