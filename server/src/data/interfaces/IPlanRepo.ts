import { IPlan } from '../../core/domain/interfaces/IPlan';

export interface IPlanRepository {
  createPlan(
    name: string,
    amount: number,
    duration: number,
    description?: string
  ): Promise<IPlan>;

  updatePlan(
    planId: string,
    name: string,
    amount: number,
    duration: number,
    description?: string
  ): Promise<IPlan | null>;

  deletePlan(planId: string): Promise<boolean>;

  getPlanById(planId: string): Promise<IPlan | null>;

  getAllPlans(
    filters: any,
    skip: number,
    limit: number
  ): Promise<{ subscriptions: IPlan[]; total: number }>;

  togglePlanStatus(planId: string): Promise<IPlan>;

  createOrUpdatePlan(
    name: string,
    amount: number,
    duration: number,
    description: string,
    postId?: string
  ): Promise<IPlan>;
}
