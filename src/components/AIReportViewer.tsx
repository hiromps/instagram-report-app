import { useState, useMemo } from 'react';
import type { InstagramRecord } from '../types';
import { aiService } from '../services/aiService';
import { statisticsService } from '../services/statisticsService';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';

interface AIReportViewerProps {
  records: InstagramRecord[];
}

export const AIReportViewer: React.FC<AIReportViewerProps> = ({ records }) => {
  const [apiKey, setApiKey] = useState(aiService.getApiKey() || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(!aiService.hasApiKey());

  const statistics = useMemo(
    () => statisticsService.calculateOverallStatistics(records),
    [records]
  );

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      aiService.setApiKey(apiKey.trim());
      setShowApiKeyInput(false);
      alert('APIキーを保存しました');
    }
  };

  const handleAnalyze = async () => {
    if (!aiService.hasApiKey()) {
      alert('APIキーを設定してください');
      setShowApiKeyInput(true);
      return;
    }

    if (records.length === 0) {
      alert('分析するデータがありません');
      return;
    }

    setIsAnalyzing(true);

    try {
      const analysisReport = await aiService.analyzeData({
        records,
        statistics,
      });

      setReport(analysisReport);
    } catch (error) {
      console.error('AI分析エラー:', error);
      alert('AI分析に失敗しました。APIキーを確認してください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (records.length === 0) {
    return (
      <Card title="AI分析レポート">
        <div className="text-center py-12 text-gray-500">
          データがありません。記録を追加してください。
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showApiKeyInput && (
        <Card title="OpenAI APIキー設定">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              AI分析機能を使用するには、OpenAI APIキーが必要です。
              <br />
              APIキーはブラウザのローカルストレージに保存され、外部に送信されません。
            </p>
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              helperText="OpenAIダッシュボードでAPIキーを取得できます"
            />
            <div className="flex space-x-2">
              <Button onClick={handleSaveApiKey}>保存</Button>
              {aiService.hasApiKey() && (
                <Button
                  variant="secondary"
                  onClick={() => setShowApiKeyInput(false)}
                >
                  キャンセル
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card
        title="AI分析レポート"
        subtitle="AIによる運用データ分析と推奨アクション"
        headerAction={
          <div className="flex space-x-2">
            {!showApiKeyInput && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowApiKeyInput(true)}
              >
                APIキー変更
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !aiService.hasApiKey()}
            >
              {isAnalyzing ? '分析中...' : 'AI分析を実行'}
            </Button>
          </div>
        }
      >
        {!report && !isAnalyzing && (
          <div className="text-center py-12 text-gray-500">
            「AI分析を実行」ボタンをクリックして、データ分析を開始してください
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">AIが分析中です...</p>
          </div>
        )}

        {report && (
          <div className="space-y-6">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">総合評価</h4>
              <p className="text-gray-700">{report.summary}</p>
            </div>

            {report.trends && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {report.trends.positive.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                      <span className="mr-2">✅</span> ポジティブ
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {report.trends.positive.map((item: string, index: number) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.trends.negative.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                      <span className="mr-2">⚠️</span> 改善が必要
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {report.trends.negative.map((item: string, index: number) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.trends.neutral.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="mr-2">💡</span> 中立的観察
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {report.trends.neutral.map((item: string, index: number) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {report.insights && report.insights.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">💡 洞察</h4>
                <div className="space-y-2">
                  {report.insights.map((insight: string, index: number) => (
                    <div
                      key={index}
                      className="bg-blue-50 rounded-lg p-3 border border-blue-200"
                    >
                      <p className="text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.recommendations && report.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">📋 推奨アクション</h4>
                <div className="space-y-2">
                  {report.recommendations.map((rec: string, index: number) => (
                    <div
                      key={index}
                      className="bg-yellow-50 rounded-lg p-3 border border-yellow-200"
                    >
                      <p className="text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.nextActions && report.nextActions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">🎯 次のステップ</h4>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <ol className="list-decimal list-inside space-y-2">
                    {report.nextActions.map((action: string, index: number) => (
                      <li key={index} className="text-gray-700">
                        {action}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
