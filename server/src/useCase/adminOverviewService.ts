import { IAdminOverviewRepository } from '../data/interfaces/IAdminOverviewRepository';
import { IReportRepository } from '../data/interfaces/IReportRepository';
import { IAdminOverviewService } from './interfaces/IAdminOverviewService';
import { RangeType,LikeRange } from '../data/interfaces/IAdminOverviewRepository';

export class AdminOverviewService implements IAdminOverviewService {
  constructor(
    private readonly _overviewRepo: IAdminOverviewRepository,
    private readonly _reportRepo: IReportRepository,
  ) {}

  async getOverview(range: RangeType = '7d', likeRange: LikeRange = { min: 0, max: Infinity }) {
    return this._overviewRepo.fetchOverview(range, likeRange);
  }

  async getMostLikedPosts(range: RangeType = '7d', likeRange: LikeRange = { min: 0, max: Infinity }) {
    return this._overviewRepo.fetchMostLikedPosts(range, likeRange);
  }

  async getReportedPosts(range: RangeType, page: number, limit: number) {
    return this._reportRepo.fetchReportedPosts(range, page, limit);
  }

  async getReportedPostsCount() {
    return this._reportRepo.getTotalReportedPostsCount();
  }
}
