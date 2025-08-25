import SubscriptionModel from '../../core/domain/models/SubscriptionModel';
import { ISubscription } from '../../core/domain/interfaces/ISubscription';
import { ISubscriptionRepository } from '../interfaces/ISubscriptionRepository';
import PlanModel from '../../core/domain/models/PlanModel';
import User from '../../core/domain/models/UserModel';
import { IPlan } from '../../core/domain/interfaces/IPlan';


class subscriptionRepository implements ISubscriptionRepository {
  async findByUserId(userId: string): Promise<ISubscription | null> {
    try {
      return await SubscriptionModel.findOne({
        userId,
        isSubscribed: true,
        startDate: { $ne: null },
        endDate: { $ne: null },
      })
        .populate('planId')
        .sort({ endDate: -1 });
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      throw new Error('Failed to fetch subscription');
    }
  }

async findAllByUserId(userId: string): Promise<ISubscription[]> {
  try {
    const subscriptions = await SubscriptionModel.find({ userId })
      .populate({ 
        path: 'userId', 
        select: 'fullname avatar username email' 
      })
      .populate('planId')
      .sort({ startDate: -1 });

    const now = new Date();

    // auto-expire old subscriptions
    await Promise.all(
      subscriptions.map(async (sub) => {
        if (sub.endDate < now && sub.isSubscribed) {
          sub.isSubscribed = false;
          await sub.save();
        }
      })
    );

    return subscriptions;
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw new Error('Failed to fetch subscriptions');
  }
}


  async createSubscription(
    userId: string,
    planId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ISubscription> {
    try {
      // deactivate old active subscriptions
      await SubscriptionModel.updateMany(
        { userId, isSubscribed: true },
        { $set: { isSubscribed: false } }
      );

      // create new subscription
      const newSubscription = await SubscriptionModel.create({
        userId,
        planId,
        isSubscribed: true,
        startDate,
        endDate,
      });

      // sync user profile
      await User.findByIdAndUpdate(userId, {
        isSubscribed: true,
        subscription: {
          isActive: true,
          startDate,
          endDate,
          plan: planId,
        },
      });

      return newSubscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  async updateSubscription(
    userId: string,
    planId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ISubscription | null> {
    try {
      const updatedSub = await SubscriptionModel.findOneAndUpdate(
        { userId, isSubscribed: true },
        { planId, startDate, endDate },
        { new: true }
      );

      await User.findByIdAndUpdate(userId, {
        subscription: {
          isActive: true,
          startDate,
          endDate,
          plan: planId,
        },
      });

      return updatedSub;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

async findAll(): Promise<ISubscription[]> {
  try {
    return await SubscriptionModel.find()
      .populate({
        path: "userId", // field in Subscription schema
        select: "fullname avatar username email", // fields from User model
      })
      .populate({
        path: "planId", // field in Subscription schema
        select: "name price duration", // select fields from Plan model if needed
      })
      .sort({ startDate: -1 });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    throw new Error("Failed to fetch subscriptions");
  }
}



  async getAllPlans(
    filters: any,
    skip: number,
    limit: number
  ): Promise<{ subscriptions: IPlan[]; total: number }> {
    const total = await PlanModel.countDocuments(filters);
    const subscriptions = await PlanModel.find({isActive: true})
      .sort({ createdAt: -1 })
      .limit(limit);
      console.log(subscriptions,">>>>");
    return { subscriptions, total };
  }


async getPlanById(planId: string): Promise<IPlan| null> {
  try {
    return await PlanModel.findById(planId);
  } catch (error) {
    console.error('Error fetching plan:', error);
    throw new Error('Failed to fetch plan');
  }
}

}


export default subscriptionRepository;
