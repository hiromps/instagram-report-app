import { useMemo } from 'react';
import type { InstagramRecord } from '../types';
import { statisticsService } from '../services/statisticsService';
import { Card } from './Card';
import { FollowerGrowthChart } from './FollowerGrowthChart';

interface DashboardProps {
  records: InstagramRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const statistics = useMemo(
    () => statisticsService.calculateOverallStatistics(records),
    [records]
  );

  const trend = useMemo(
    () => statisticsService.calculateGrowthTrend(records),
    [records]
  );

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }> = ({ title, value, subtitle, color = 'purple' }) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
        <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
      </div>
    );
  };

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            データがありません
          </h3>
          <p className="text-gray-500">
            「データ入力」タブから記録を追加してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="総記録数"
          value={`${statistics.totalRecords}日`}
          subtitle="運用日数"
        />
        <StatCard
          title="総フォロワー増加"
          value={`${statistics.totalFollowerGrowth}人`}
          subtitle={`平均 ${statistics.averageFollowerGrowth}人/日`}
          color="green"
        />
        <StatCard
          title="平均フォローバック率"
          value={`${statistics.averageFollowBackRate}%`}
          subtitle="フォローに対するフォロワー獲得率"
          color="pink"
        />
        <StatCard
          title="総運用時間"
          value={`${Math.floor(statistics.totalOperationTime / 60)}時間`}
          subtitle={`${statistics.totalOperationTime % 60}分`}
          color="blue"
        />
      </div>

      <Card title="トレンド分析">
        <div className="flex items-center space-x-4">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              trend.isPositive ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <span className="text-2xl">
              {trend.isPositive ? '↗️' : '↘️'}
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {trend.description}
            </h4>
            <p className="text-sm text-gray-600">
              前半と比較して{trend.isPositive ? '増加' : '減少'}傾向（
              {trend.percentage.toFixed(1)}%）
            </p>
          </div>
        </div>
      </Card>

      <FollowerGrowthChart records={records} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="ベストパフォーマンス">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">最高のフォロワー増加日</p>
            <p className="text-xl font-semibold text-green-600">
              {statistics.bestPerformanceDate || 'データなし'}
            </p>
            {statistics.bestPerformanceDate && (
              <p className="text-sm text-gray-500">
                {
                  records.find(r => r.date === statistics.bestPerformanceDate)
                    ?.followerGrowth || 0
                }
                人増加
              </p>
            )}
          </div>
        </Card>

        <Card title="改善が必要な日">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">フォロワー増加が少なかった日</p>
            <p className="text-xl font-semibold text-red-600">
              {statistics.worstPerformanceDate || 'データなし'}
            </p>
            {statistics.worstPerformanceDate && (
              <p className="text-sm text-gray-500">
                {
                  records.find(r => r.date === statistics.worstPerformanceDate)
                    ?.followerGrowth || 0
                }
                人増加
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card title="総合統計">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">総いいね数</p>
            <p className="text-2xl font-semibold text-purple-600">
              {statistics.totalLikes.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">総フォロー増加</p>
            <p className="text-2xl font-semibold text-purple-600">
              {statistics.totalFollowingGrowth.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">平均運用時間</p>
            <p className="text-2xl font-semibold text-purple-600">
              {Math.round(statistics.totalOperationTime / statistics.totalRecords)}分
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">日平均いいね</p>
            <p className="text-2xl font-semibold text-purple-600">
              {Math.round(statistics.totalLikes / statistics.totalRecords)}回
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
