import SubscriptionModel from '../../core/domain/models/SubscriptionModel';
import User from '../../core/domain/models/UserModel';
import { ISubscription } from '../../core/domain/interfaces/ISubscription';
import { ISubscriptionRepository } from '../interfaces/ISubscriptionRepository';

class SubscriptionRepository implements ISubscriptionRepository {
  /**
   * Fetch latest active subscription for user
   */
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

  /**
   * Fetch all subscriptions and mark expired ones inactive
   */
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

  /**
   * Create subscription and update User model's subscription & role
   */
  async createSubscription(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription> {
    try {
      const subscription = await SubscriptionModel.create({
        userId,
        isSubscribed: true,
        startDate,
        endDate,
      });

      // Update user record as proUser
      await User.findByIdAndUpdate(userId, {
        role: 'proUser',
        subscription: {
          isActive: true,
          startDate,
          endDate,
        },
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Update subscription if already exists
   */
  async updateSubscription(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription | null> {
    try {
      const updated = await SubscriptionModel.findOneAndUpdate(
        { userId },
        {
          isSubscribed: true,
          startDate,
          endDate,
        },
        { new: true },
      );

      // Sync user model as well
      if (updated) {
        await User.findByIdAndUpdate(userId, {
          role: 'proUser',
          subscription: {
            isActive: true,
            startDate,
            endDate,
          },
        });
      }

      return updated;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }
}

export default  SubscriptionRepository
