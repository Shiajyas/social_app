import { RangeType, LikeRange, AdminOverview, MostLikedPost, ReportedPost } from "../../data/interfaces/IAdminOverviewRepository"

export interface IAdminOverviewService {
  getOverview(range: RangeType, likeRange: LikeRange): Promise<AdminOverview>;
  getMostLikedPosts(range: RangeType, likeRange: LikeRange): Promise<MostLikedPost[]>;
  getReportedPosts(range: RangeType, page: number, limit: number): Promise<ReportedPost[]>;
  getReportedPostsCount(): Promise<number>;
}
    