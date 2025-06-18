import Post from '../../core/domain/models/PostModel';
import User from '../../core/domain/models/UserModel';
import { CommentModel } from '../../core/domain/models/CommentModel';
import SubscriptionModel from '../../core/domain/models/SubscriptionModel';
import dayjs from 'dayjs';
import {
  IAdminOverviewRepository,
  AdminOverview,
  LikeRange,
  MostLikedPost,
  RangeType,
} from "../interfaces/IAdminOverviewRepository";

export class AdminOverviewRepository implements IAdminOverviewRepository {
  async fetchOverview(
    range: RangeType = '7d',
    likeRange: LikeRange = { min: 0, max: Infinity },
  ): Promise<AdminOverview> {
    const now = new Date();
    const startDate = dayjs(now)
      .subtract(
        range === '1y' ? 1 : range === '1m' ? 1 : 7,
        range === '1y' ? 'year' : range === '1m' ? 'month' : 'day',
      )
      .toDate();

    const [
      totalUsers,
      newUsers,
      totalPosts,
      totalComments,
      reportedPosts,
      activeSubscriptions,
      newSubscriptions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Post.countDocuments(),
      CommentModel.countDocuments(),
      Post.countDocuments({ reports: { $exists: true, $not: { $size: 0 } } }),
      SubscriptionModel.countDocuments({ isSubscribed: true }),
      SubscriptionModel.countDocuments({
        isSubscribed: true,
        createdAt: { $gte: startDate },
      }),
    ]);

    const weeklyUserGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const mostLikedPosts = await this.fetchMostLikedPosts(range, likeRange);

    const postingActivity = await Post.aggregate([
      {
        $group: {
          _id: '$userId',
          posts: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          username: '$user.username',
          posts: 1,
        },
      },
      { $sort: { posts: -1 } },
      { $limit: 5 },
    ]);

    return {
      users: {
        total: totalUsers,
        new: newUsers,
        weeklyGrowth: weeklyUserGrowth,
        postingActivity: postingActivity.map(({ username, posts }) => ({
          username,
          posts,
        })),
      },
      posts: {
        total: totalPosts,
        reported: reportedPosts,
        mostLiked: mostLikedPosts,
      },
      comments: { total: totalComments },
      subscriptions: { active: activeSubscriptions, new: newSubscriptions },
    };
  }

  async fetchMostLikedPosts(
    range: RangeType = '7d',
    likeRange: LikeRange = { min: 0, max: Infinity },
  ): Promise<MostLikedPost[]> {
    const now = new Date();
    const startDate = dayjs(now)
      .subtract(
        range === '1y' ? 1 : range === '1m' ? 1 : 7,
        range === '1y' ? 'year' : range === '1m' ? 'month' : 'day',
      )
      .toDate();

    const posts = await Post.find({
      createdAt: { $gte: startDate },
    })
      .populate({
        path: 'userId',
        select: 'username fullname avatar',
      })
      .lean();

    const filteredPosts = posts
      .map((post) => ({
        ...post,
        likesCount: post.likes?.length || 0,
      }))
      .filter(
        (post) =>
          post.likesCount >= likeRange.min && post.likesCount <= likeRange.max,
      )
      .sort((a, b) => b.likesCount - a.likesCount)
      .slice(0, 5);

 return filteredPosts.map((post) => ({
  title: post.title,
  likes: post.likesCount,
  owner: post.userId.toString() || 'Unknown',
}));
  }
}
