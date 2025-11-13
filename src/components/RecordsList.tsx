import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { DailyAggregatedRecord } from '../utils/recordAggregation';
import { Card } from './Card';
import { Button } from './Button';

interface RecordsListProps {
  aggregatedRecords: DailyAggregatedRecord[];
  onDelete?: (id: string) => void;
}

export const RecordsList: React.FC<RecordsListProps> = ({
  aggregatedRecords,
  onDelete,
}) => {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'yyyy年M月d日(E)', { locale: ja });
    } catch {
      return dateStr;
    }
  };

  if (aggregatedRecords.length === 0) {
    return (
      <Card title="記録一覧">
        <div className="text-center py-8 text-gray-500">
          記録がありません
        </div>
      </Card>
    );
  }

  return (
    <Card title="記録一覧">
      <div className="space-y-4">
        {aggregatedRecords.map((aggregated) => (
          <div
            key={aggregated.date}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* 日次サマリー */}
            <div
              className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 cursor-pointer hover:from-purple-100 hover:to-pink-100 transition-colors"
              onClick={() => toggleDate(aggregated.date)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {formatDate(aggregated.date)}
                    </h3>
                    {aggregated.recordCount > 1 && (
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                        {aggregated.recordCount}件
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-gray-600">フォロワー増減: </span>
                      <span
                        className={`font-semibold ${
                          aggregated.followerGrowth >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {aggregated.followerGrowth >= 0 ? '+' : ''}
                        {aggregated.followerGrowth}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">いいね: </span>
                      <span className="font-semibold text-purple-600">
                        {aggregated.likes}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">運用時間: </span>
                      <span className="font-semibold text-blue-600">
                        {aggregated.operationTime}分
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">フォローバック率: </span>
                      <span className="font-semibold text-pink-600">
                        {aggregated.followBackRate}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <span
                    className={`transform transition-transform ${
                      expandedDates.has(aggregated.date) ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </div>
            </div>

            {/* 個別レコード詳細 */}
            {expandedDates.has(aggregated.date) && (
              <div className="bg-white">
                {aggregated.records.map((record, index) => (
                  <div
                    key={record.id}
                    className="border-t border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                            記録 {index + 1}
                          </span>
                          {record.startTime && (
                            <span className="text-sm text-gray-600">
                              開始時刻: {record.startTime}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <div className="text-gray-600">運用前</div>
                            <div className="font-mono text-xs mt-1">
                              投稿: {record.postsBefore} / フォロワー:{' '}
                              {record.followersBefore} / フォロー:{' '}
                              {record.followingBefore}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">運用後</div>
                            <div className="font-mono text-xs mt-1">
                              投稿: {record.postsAfter} / フォロワー:{' '}
                              {record.followersAfter} / フォロー:{' '}
                              {record.followingAfter}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">活動</div>
                            <div className="font-mono text-xs mt-1">
                              いいね: {record.likes} / ループ:{' '}
                              {record.mainLoop} / 時間: {record.operationTime}分
                            </div>
                          </div>
                        </div>
                        {record.otherMemo && (
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="text-gray-600">メモ: </span>
                            {record.otherMemo}
                          </div>
                        )}
                      </div>
                      {onDelete && (
                        <Button
                          onClick={() => onDelete(record.id)}
                          className="ml-4 text-sm bg-red-500 hover:bg-red-600"
                        >
                          削除
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
