import type {
  InstagramRecord,
  StatisticsSummary,
  WeeklyStats,
  MonthlyStats
} from '../types';
import {
  startOfWeek,
  endOfWeek,
  format,
  parseISO
} from 'date-fns';
import { ja } from 'date-fns/locale';

class StatisticsService {
  // 全期間の統計を計算
  calculateOverallStatistics(records: InstagramRecord[]): StatisticsSummary {
    if (records.length === 0) {
      return this.getEmptyStatistics();
    }

    const totalFollowerGrowth = records.reduce(
      (sum, r) => sum + (r.followerGrowth || 0),
      0
    );
    const totalFollowingGrowth = records.reduce(
      (sum, r) => sum + (r.followingGrowth || 0),
      0
    );
    const totalOperationTime = records.reduce(
      (sum, r) => sum + r.operationTime,
      0
    );
    const totalLikes = records.reduce(
      (sum, r) => sum + r.likes,
      0
    );

    const validFollowBackRates = records
      .filter(r => r.followBackRate !== undefined && r.followBackRate > 0)
      .map(r => r.followBackRate!);

    const averageFollowBackRate = validFollowBackRates.length > 0
      ? validFollowBackRates.reduce((sum, rate) => sum + rate, 0) / validFollowBackRates.length
      : 0;

    // 最良・最悪のパフォーマンス日を特定
    const sortedByGrowth = [...records].sort(
      (a, b) => (b.followerGrowth || 0) - (a.followerGrowth || 0)
    );

    return {
      totalRecords: records.length,
      totalOperationTime,
      totalLikes,
      totalFollowerGrowth,
      totalFollowingGrowth,
      averageFollowerGrowth: Math.round(totalFollowerGrowth / records.length * 100) / 100,
      averageFollowBackRate: Math.round(averageFollowBackRate * 100) / 100,
      bestPerformanceDate: sortedByGrowth[0]?.date || '',
      worstPerformanceDate: sortedByGrowth[sortedByGrowth.length - 1]?.date || '',
    };
  }

  // 週次統計を計算
  calculateWeeklyStatistics(records: InstagramRecord[]): WeeklyStats[] {
    const weekMap = new Map<string, InstagramRecord[]>();

    records.forEach(record => {
      const date = parseISO(record.date);
      const weekStart = startOfWeek(date, { locale: ja });
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey)!.push(record);
    });

    const weeklyStats: WeeklyStats[] = [];

    weekMap.forEach((weekRecords, weekKey) => {
      const weekStart = parseISO(weekKey);
      const weekEnd = endOfWeek(weekStart, { locale: ja });

      const totalFollowerGrowth = weekRecords.reduce(
        (sum, r) => sum + (r.followerGrowth || 0),
        0
      );
      const totalFollowingGrowth = weekRecords.reduce(
        (sum, r) => sum + (r.followingGrowth || 0),
        0
      );
      const totalOperationTime = weekRecords.reduce(
        (sum, r) => sum + r.operationTime,
        0
      );
      const totalLikes = weekRecords.reduce(
        (sum, r) => sum + r.likes,
        0
      );

      const validFollowBackRates = weekRecords
        .filter(r => r.followBackRate !== undefined && r.followBackRate > 0)
        .map(r => r.followBackRate!);

      const averageFollowBackRate = validFollowBackRates.length > 0
        ? validFollowBackRates.reduce((sum, rate) => sum + rate, 0) / validFollowBackRates.length
        : 0;

      weeklyStats.push({
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        recordCount: weekRecords.length,
        totalFollowerGrowth,
        totalFollowingGrowth,
        averageFollowBackRate: Math.round(averageFollowBackRate * 100) / 100,
        totalOperationTime,
        totalLikes,
      });
    });

    return weeklyStats.sort((a, b) =>
      new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
  }

  // 月次統計を計算
  calculateMonthlyStatistics(records: InstagramRecord[]): MonthlyStats[] {
    const monthMap = new Map<string, InstagramRecord[]>();

    records.forEach(record => {
      const date = parseISO(record.date);
      const monthKey = format(date, 'yyyy-MM');

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, []);
      }
      monthMap.get(monthKey)!.push(record);
    });

    const monthlyStats: MonthlyStats[] = [];

    monthMap.forEach((monthRecords, monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);

      const totalFollowerGrowth = monthRecords.reduce(
        (sum, r) => sum + (r.followerGrowth || 0),
        0
      );
      const totalFollowingGrowth = monthRecords.reduce(
        (sum, r) => sum + (r.followingGrowth || 0),
        0
      );
      const totalOperationTime = monthRecords.reduce(
        (sum, r) => sum + r.operationTime,
        0
      );
      const totalLikes = monthRecords.reduce(
        (sum, r) => sum + r.likes,
        0
      );

      const validFollowBackRates = monthRecords
        .filter(r => r.followBackRate !== undefined && r.followBackRate > 0)
        .map(r => r.followBackRate!);

      const averageFollowBackRate = validFollowBackRates.length > 0
        ? validFollowBackRates.reduce((sum, rate) => sum + rate, 0) / validFollowBackRates.length
        : 0;

      const dailyAverageGrowth = totalFollowerGrowth / monthRecords.length;

      monthlyStats.push({
        month: format(new Date(year, month - 1), 'yyyy年M月', { locale: ja }),
        year,
        recordCount: monthRecords.length,
        totalFollowerGrowth,
        totalFollowingGrowth,
        averageFollowBackRate: Math.round(averageFollowBackRate * 100) / 100,
        totalOperationTime,
        totalLikes,
        dailyAverageGrowth: Math.round(dailyAverageGrowth * 100) / 100,
      });
    });

    return monthlyStats.sort((a, b) => {
      const dateA = new Date(a.year, parseInt(a.month.split('年')[1]) - 1);
      const dateB = new Date(b.year, parseInt(b.month.split('年')[1]) - 1);
      return dateB.getTime() - dateA.getTime();
    });
  }

  // 空の統計データを返す
  private getEmptyStatistics(): StatisticsSummary {
    return {
      totalRecords: 0,
      totalOperationTime: 0,
      totalLikes: 0,
      totalFollowerGrowth: 0,
      totalFollowingGrowth: 0,
      averageFollowerGrowth: 0,
      averageFollowBackRate: 0,
      bestPerformanceDate: '',
      worstPerformanceDate: '',
    };
  }

  // 成長率トレンドの計算
  calculateGrowthTrend(records: InstagramRecord[]): {
    isPositive: boolean;
    percentage: number;
    description: string;
  } {
    if (records.length < 2) {
      return {
        isPositive: true,
        percentage: 0,
        description: 'データが不足しています',
      };
    }

    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstHalf = sortedRecords.slice(0, Math.floor(sortedRecords.length / 2));
    const secondHalf = sortedRecords.slice(Math.floor(sortedRecords.length / 2));

    const firstHalfAvg = firstHalf.reduce(
      (sum, r) => sum + (r.followerGrowth || 0),
      0
    ) / firstHalf.length;

    const secondHalfAvg = secondHalf.reduce(
      (sum, r) => sum + (r.followerGrowth || 0),
      0
    ) / secondHalf.length;

    const change = secondHalfAvg - firstHalfAvg;
    const percentage = firstHalfAvg !== 0
      ? (change / Math.abs(firstHalfAvg)) * 100
      : 0;

    let description = '';
    if (percentage > 10) {
      description = '大幅に改善しています';
    } else if (percentage > 0) {
      description = '緩やかに改善しています';
    } else if (percentage > -10) {
      description = '緩やかに低下しています';
    } else {
      description = '大幅に低下しています';
    }

    return {
      isPositive: change >= 0,
      percentage: Math.round(Math.abs(percentage) * 100) / 100,
      description,
    };
  }
}

export const statisticsService = new StatisticsService();
