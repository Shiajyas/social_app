import SubscriptionModel from '../../core/domain/models/SubscriptionModel';
import { ISubscription } from '../../core/domain/interfaces/ISubscription';
import { ISubscriptionRepository } from '../interfaces/ISubscriptionRepository';
import User from '../../core/domain/models/UserModel';

class SubscriptionRepository implements ISubscriptionRepository {
  async findByUserId(userId: string): Promise<ISubscription | null> {
    try {
      const sub = await SubscriptionModel.findOne({
        userId,
        isSubscribed: true,
        startDate: { $ne: null },
        endDate: { $ne: null },
      }).sort({ endDate: -1 });

      return sub;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw new Error('Failed to fetch subscription');
    }
  }

  async findAllByUserId(userId: string): Promise<ISubscription[]> {
    try {
      const subscriptions = await SubscriptionModel.find({
        userId,
        startDate: { $ne: null },
        endDate: { $ne: null },
      }).sort({ startDate: -1 });

      const now = new Date();

      await Promise.all(
        subscriptions.map(async (sub) => {
          if (sub.endDate < now && sub.isSubscribed) {
            sub.isSubscribed = false;
            await sub.save();
          }
        }),
      );

      return subscriptions;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw new Error('Failed to fetch subscriptions');
    }
  }

  async createSubscription(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription> {
    try {
      // Deactivate old subscriptions
      await SubscriptionModel.updateMany(
        { userId, isSubscribed: true },
        { $set: { isSubscribed: false } },
      );

      // Create new subscription
      const newSubscription = await SubscriptionModel.create({
        userId,
        isSubscribed: true,
        startDate,
        endDate,
      });

      // Update user document
      await User.findByIdAndUpdate(userId, {
        isSubscribed: true,
        subscription: {
          isActive: true,
          startDate,
          endDate,
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
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription | null> {
    try {
      const updatedSub = await SubscriptionModel.findOneAndUpdate(
        { userId, isSubscribed: true },
        { startDate, endDate },
        { new: true },
      );

      // Sync with user profile
      await User.findByIdAndUpdate(userId, {
        subscription: {
          isActive: true,
          startDate,
          endDate,
        },
      });

      return updatedSub;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }
}

export default SubscriptionRepository;
