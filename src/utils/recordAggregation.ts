import type { InstagramRecord } from '../types';

/**
 * 日次集約レコード - 同じ日付の複数レコードを合計したもの
 */
export interface DailyAggregatedRecord {
  date: string;
  recordCount: number; // その日の記録数

  // 合計値（運用前データは最初のレコードの値を使用）
  postsBefore: number;
  followersBefore: number;
  followingBefore: number;

  // 合計値（運用後データは最後のレコードの値を使用）
  postsAfter: number;
  followersAfter: number;
  followingAfter: number;

  // 合計値
  likes: number;
  mainLoop: number;
  operationTime: number;

  // 計算値
  followerGrowth: number;
  followingGrowth: number;
  postGrowth: number;
  followBackRate: number;

  // 個別レコードへの参照
  records: InstagramRecord[];

  // アカウント情報
  accountName: string;
  accountId: string;
}

/**
 * InstagramRecordの配列を日付ごとに集約する
 */
export function aggregateRecordsByDate(
  records: InstagramRecord[]
): DailyAggregatedRecord[] {
  // 日付でグループ化
  const dateMap = new Map<string, InstagramRecord[]>();

  records.forEach(record => {
    if (!dateMap.has(record.date)) {
      dateMap.set(record.date, []);
    }
    dateMap.get(record.date)!.push(record);
  });

  // 各日付のレコードを集約
  const aggregatedRecords: DailyAggregatedRecord[] = [];

  dateMap.forEach((dayRecords, date) => {
    // 作成日時でソート（古い順）
    const sortedRecords = [...dayRecords].sort(
      (a, b) => new Date(a.id).getTime() - new Date(b.id).getTime()
    );

    const firstRecord = sortedRecords[0];
    const lastRecord = sortedRecords[sortedRecords.length - 1];

    // 合計値を計算
    const totalLikes = sortedRecords.reduce((sum, r) => sum + r.likes, 0);
    const totalMainLoop = sortedRecords.reduce((sum, r) => sum + r.mainLoop, 0);
    const totalOperationTime = sortedRecords.reduce((sum, r) => sum + r.operationTime, 0);

    // 増減値を計算（最初のbeforeと最後のafterの差分）
    const followerGrowth = lastRecord.followersAfter - firstRecord.followersBefore;
    const followingGrowth = lastRecord.followingAfter - firstRecord.followingBefore;
    const postGrowth = lastRecord.postsAfter - firstRecord.postsBefore;

    // フォローバック率を計算
    const followBackRate = followingGrowth > 0
      ? (followerGrowth / followingGrowth) * 100
      : 0;

    aggregatedRecords.push({
      date,
      recordCount: sortedRecords.length,
      postsBefore: firstRecord.postsBefore,
      followersBefore: firstRecord.followersBefore,
      followingBefore: firstRecord.followingBefore,
      postsAfter: lastRecord.postsAfter,
      followersAfter: lastRecord.followersAfter,
      followingAfter: lastRecord.followingAfter,
      likes: totalLikes,
      mainLoop: totalMainLoop,
      operationTime: totalOperationTime,
      followerGrowth,
      followingGrowth,
      postGrowth,
      followBackRate: Math.round(followBackRate * 100) / 100,
      records: sortedRecords,
      accountName: firstRecord.accountName,
      accountId: firstRecord.accountId,
    });
  });

  // 日付でソート（新しい順）
  return aggregatedRecords.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * 日次集約レコードをInstagramRecordの形式に変換
 * （統計計算などで既存のコードを再利用するため）
 */
export function dailyAggregatedToInstagramRecord(
  aggregated: DailyAggregatedRecord
): InstagramRecord {
  return {
    id: `aggregated-${aggregated.date}`,
    date: aggregated.date,
    postsBefore: aggregated.postsBefore,
    followersBefore: aggregated.followersBefore,
    followingBefore: aggregated.followingBefore,
    postsAfter: aggregated.postsAfter,
    followersAfter: aggregated.followersAfter,
    followingAfter: aggregated.followingAfter,
    startTime: aggregated.records[0]?.startTime || '',
    likes: aggregated.likes,
    mainLoop: aggregated.mainLoop,
    operationTime: aggregated.operationTime,
    otherMemo: `${aggregated.recordCount}件の記録を集約`,
    accountName: aggregated.accountName,
    accountId: aggregated.accountId,
    followerGrowth: aggregated.followerGrowth,
    followingGrowth: aggregated.followingGrowth,
    postGrowth: aggregated.postGrowth,
    followBackRate: aggregated.followBackRate,
  };
}

/**
 * 日次集約レコードの配列をInstagramRecordの配列に変換
 */
export function convertAggregatedRecordsToInstagramRecords(
  aggregatedRecords: DailyAggregatedRecord[]
): InstagramRecord[] {
  return aggregatedRecords.map(dailyAggregatedToInstagramRecord);
}
