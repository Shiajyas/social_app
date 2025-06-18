export type RangeType = '7d' | '1m' | '1y';

export interface LikeRange {
  min: number;
  max: number;
}

export interface ReportedPost {
  _id: string;
  title: string;
  content: string;
  owner: {
    _id: string;
    username: string;
    email: string;
  };
  likeCount: number;
  reportCount: number;
  createdAt: string; // ISO timestamp
}


export interface MostLikedPost {
  title: string;
  likes: number;
  owner: string;
}

export interface PostingActivity {
  username: string;
  posts: number;
}

export interface WeeklyGrowthEntry {
  _id: string; // formatted date string
  count: number;
}

export interface AdminOverview {
  users: {
    total: number;
    new: number;
    weeklyGrowth: WeeklyGrowthEntry[];
    postingActivity: PostingActivity[];
  };
  posts: {
    total: number;
    reported: number;
    mostLiked: MostLikedPost[];
  };
  comments: {
    total: number;
  };
  subscriptions: {
    active: number;
    new: number;
  };
}

export interface IAdminOverviewRepository {
  fetchOverview(range?: RangeType, likeRange?: LikeRange): Promise<AdminOverview>;
  fetchMostLikedPosts(range?: RangeType, likeRange?: LikeRange): Promise<MostLikedPost[]>;
}
