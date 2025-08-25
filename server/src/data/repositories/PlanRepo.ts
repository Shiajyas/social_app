import { IPlan } from '../../core/domain/interfaces/IPlan';
import PlanModel from '../../core/domain/models/PlanModel';
import { IPlanRepository } from '../interfaces/IPlanRepo';

export class PlanRepository implements IPlanRepository {
  async createPlan(
    name: string,
    amount: number,
    duration: number,
    description?: string,
  ): Promise<IPlan> {
    return await PlanModel.create({
      name,
      amount,
      duration,
      description,
      isActive: true,
    });
  }

  async createOrUpdatePlan(name: string, amount: number, duration: number, description: string, planId?: string): Promise<IPlan> {
    const plan = await PlanModel.findById(planId);
    if (plan) {
      plan.name = name;
      plan.amount = amount;
      plan.duration = duration;
      plan.description = description;
      plan.features.push("test");
      return await plan.save();
    }
    return await PlanModel.create({
      name,
      amount,
      duration,
      description,
      features: ["test"],
      isActive: true,
    });
  }
  


  async updatePlan(
    planId: string,
    name: string,
    amount: number,
    duration: number,
    description?: string,
  ): Promise<IPlan | null> {
    return await PlanModel.findByIdAndUpdate(
      planId,
      { name, amount, duration, description },
      { new: true },
    );
  }

  async deletePlan(planId: string): Promise<boolean> {
    const result = await PlanModel.findByIdAndDelete(planId);
    return !!result;
  }

  async getPlanById(planId: string): Promise<IPlan | null> {
    return await PlanModel.findById(planId);
  }

  async getAllPlans(
    filters: any,
    skip: number,
    limit: number
  ): Promise<{ subscriptions: IPlan[]; total: number }> {
    const total = await PlanModel.countDocuments(filters);
    const subscriptions = await PlanModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      console.log(subscriptions,">>>>");
    return { subscriptions, total };
  }

  

  async togglePlanStatus(planId: string): Promise<IPlan> {
    const plan = await PlanModel.findById(planId);
    if (!plan) throw new Error('Plan not found');
    plan.isActive = !plan.isActive;
    await plan.save();
    return plan;
  }
}
