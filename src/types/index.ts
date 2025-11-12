// Instagram運用データの型定義

export interface InstagramAccount {
  accountName: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
}

export interface InstagramRecord {
  id: string;
  date: string;

  // 運用前のデータ
  postsBefore: number;
  followersBefore: number;
  followingBefore: number;

  // 運用後のデータ
  postsAfter: number;
  followersAfter: number;
  followingAfter: number;

  // 運用活動の詳細
  startTime: string;
  likes: number;
  mainLoop: number;
  operationTime: number;
  otherMemo: string;

  // アカウント情報
  accountName: string;
  accountId: string;

  // 自動計算フィールド
  followerGrowth?: number;
  followingGrowth?: number;
  postGrowth?: number;
  followBackRate?: number;
}

export interface StatisticsSummary {
  totalRecords: number;
  totalOperationTime: number;
  totalLikes: number;
  totalFollowerGrowth: number;
  totalFollowingGrowth: number;
  averageFollowerGrowth: number;
  averageFollowBackRate: number;
  bestPerformanceDate: string;
  worstPerformanceDate: string;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  recordCount: number;
  totalFollowerGrowth: number;
  totalFollowingGrowth: number;
  averageFollowBackRate: number;
  totalOperationTime: number;
  totalLikes: number;
}

export interface MonthlyStats {
  month: string;
  year: number;
  recordCount: number;
  totalFollowerGrowth: number;
  totalFollowingGrowth: number;
  averageFollowBackRate: number;
  totalOperationTime: number;
  totalLikes: number;
  dailyAverageGrowth: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AIAnalysisRequest {
  records: InstagramRecord[];
  statistics: StatisticsSummary;
  targetGoal?: {
    type: 'follower' | 'engagement' | 'growth_rate';
    value: number;
    timeframe: string;
  };
}

export interface AIAnalysisResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  goalProgress?: {
    current: number;
    target: number;
    percentage: number;
    onTrack: boolean;
  };
  trends: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  nextActions: string[];
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange?: {
    start: string;
    end: string;
  };
  includeCharts?: boolean;
  includeAIAnalysis?: boolean;
}

export type PeriodType = 'all' | 'weekly' | 'monthly';

export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  minFollowerGrowth?: number;
  maxFollowerGrowth?: number;
  period?: PeriodType;
}
