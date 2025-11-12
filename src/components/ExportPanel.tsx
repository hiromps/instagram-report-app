import { useMemo, useState } from 'react';
import type { InstagramRecord } from '../types';
import { exportService } from '../services/exportService';
import { statisticsService } from '../services/statisticsService';
import { Card } from './Card';
import { Button } from './Button';

interface ExportPanelProps {
  records: InstagramRecord[];
  accountName: string;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ records, accountName }) => {
  const [exporting, setExporting] = useState(false);

  const statistics = useMemo(
    () => statisticsService.calculateOverallStatistics(records),
    [records]
  );

  const handleExportCSV = () => {
    setExporting(true);
    try {
      exportService.exportToCSV(records, statistics);
    } catch (error) {
      alert('CSVエクスポートに失敗しました');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = () => {
    setExporting(true);
    try {
      exportService.exportToJSON(records, statistics);
    } catch (error) {
      alert('JSONエクスポートに失敗しました');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    setExporting(true);
    try {
      exportService.exportToPDF(records, statistics, accountName);
    } catch (error) {
      alert('PDFエクスポートに失敗しました');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleCopyText = async () => {
    try {
      const textReport = exportService.generateTextReport(records, statistics);
      await exportService.copyToClipboard(textReport);
      alert('テキストレポートをクリップボードにコピーしました');
    } catch (error) {
      alert('コピーに失敗しました');
      console.error(error);
    }
  };

  if (records.length === 0) {
    return (
      <Card title="データエクスポート">
        <div className="text-center py-12 text-gray-500">
          エクスポートするデータがありません
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="データエクスポート" subtitle="運用データを様々な形式でエクスポートできます">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-gray-900 mb-2">CSV形式</h4>
            <p className="text-sm text-gray-600 mb-4">
              Excel や Google Sheetsで開けるCSVファイル
            </p>
            <Button
              onClick={handleExportCSV}
              disabled={exporting}
              fullWidth
              variant="primary"
            >
              CSVダウンロード
            </Button>
          </div>

          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-gray-900 mb-2">JSON形式</h4>
            <p className="text-sm text-gray-600 mb-4">
              プログラムで処理可能なJSON形式
            </p>
            <Button
              onClick={handleExportJSON}
              disabled={exporting}
              fullWidth
              variant="primary"
            >
              JSONダウンロード
            </Button>
          </div>

          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-gray-900 mb-2">PDF形式</h4>
            <p className="text-sm text-gray-600 mb-4">
              印刷・共有に適したPDFレポート
            </p>
            <Button
              onClick={handleExportPDF}
              disabled={exporting}
              fullWidth
              variant="primary"
            >
              PDFダウンロード
            </Button>
          </div>

          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-gray-900 mb-2">テキストコピー</h4>
            <p className="text-sm text-gray-600 mb-4">
              テキスト形式でクリップボードにコピー
            </p>
            <Button
              onClick={handleCopyText}
              disabled={exporting}
              fullWidth
              variant="secondary"
            >
              クリップボードにコピー
            </Button>
          </div>
        </div>
      </Card>

      <Card title="データ統計">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">記録数</p>
            <p className="text-2xl font-bold text-purple-600">
              {statistics.totalRecords}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">総フォロワー増加</p>
            <p className="text-2xl font-bold text-green-600">
              {statistics.totalFollowerGrowth}
            </p>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">平均FB率</p>
            <p className="text-2xl font-bold text-pink-600">
              {statistics.averageFollowBackRate}%
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">総運用時間</p>
            <p className="text-2xl font-bold text-blue-600">
              {Math.floor(statistics.totalOperationTime / 60)}h
            </p>
          </div>
        </div>
      </Card>

      <Card title="最近の記録">
        <div className="space-y-2">
          {records.slice(0, 5).map((record) => (
            <div
              key={record.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{record.date}</p>
                <p className="text-sm text-gray-600">
                  フォロワー: +{record.followerGrowth || 0} | FB率: {record.followBackRate || 0}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {record.operationTime}分
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
