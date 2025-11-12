import type { InstagramRecord, StatisticsSummary } from '../types';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

class ExportService {
  // CSVエクスポート
  exportToCSV(
    records: InstagramRecord[],
    statistics?: StatisticsSummary,
    filename?: string
  ): void {
    const csvData = records.map(record => ({
      '日付': record.date,
      'アカウント名': record.accountName,
      'アカウントID': record.accountId,
      '投稿数（前）': record.postsBefore,
      '投稿数（後）': record.postsAfter,
      'フォロワー数（前）': record.followersBefore,
      'フォロワー数（後）': record.followersAfter,
      'フォロー数（前）': record.followingBefore,
      'フォロー数（後）': record.followingAfter,
      'フォロワー増加': record.followerGrowth || 0,
      'フォロー増加': record.followingGrowth || 0,
      'フォローバック率（%）': record.followBackRate || 0,
      '開始時刻': record.startTime,
      'いいね数': record.likes,
      'ループ回数': record.mainLoop,
      '運用時間（分）': record.operationTime,
      'メモ': record.otherMemo,
    }));

    // 統計情報を追加
    if (statistics) {
      csvData.push({} as any); // 空行
      csvData.push({
        '日付': '統計サマリー',
        'アカウント名': '',
        'アカウントID': '',
      } as any);
      csvData.push({
        '日付': '総記録数',
        'アカウント名': statistics.totalRecords.toString(),
        'アカウントID': '',
      } as any);
      csvData.push({
        '日付': '総フォロワー増加',
        'アカウント名': statistics.totalFollowerGrowth.toString(),
        'アカウントID': '',
      } as any);
      csvData.push({
        '日付': '平均フォロワー増加',
        'アカウント名': statistics.averageFollowerGrowth.toString(),
        'アカウントID': '',
      } as any);
      csvData.push({
        '日付': '平均フォローバック率',
        'アカウント名': `${statistics.averageFollowBackRate}%`,
        'アカウントID': '',
      } as any);
    }

    const csv = Papa.unparse(csvData, {
      header: true
    });

    // BOM付きUTF-8でエンコード（Excel対応）
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

    const defaultFilename = `instagram_report_${format(new Date(), 'yyyyMMdd')}.csv`;
    this.downloadFile(blob, filename || defaultFilename);
  }

  // JSONエクスポート
  exportToJSON(
    records: InstagramRecord[],
    statistics?: StatisticsSummary,
    filename?: string
  ): void {
    const data = {
      exportedAt: new Date().toISOString(),
      records,
      statistics: statistics || null,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });

    const defaultFilename = `instagram_report_${format(new Date(), 'yyyyMMdd')}.json`;
    this.downloadFile(blob, filename || defaultFilename);
  }

  // PDFエクスポート
  exportToPDF(
    records: InstagramRecord[],
    statistics: StatisticsSummary,
    accountName: string,
    filename?: string
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // タイトル
    doc.setFontSize(18);
    doc.text('Instagram運用レポート', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // アカウント情報
    doc.setFontSize(12);
    doc.text(`アカウント: ${accountName}`, 20, yPosition);
    yPosition += 7;
    doc.text(
      `出力日時: ${format(new Date(), 'yyyy年MM月dd日 HH:mm', { locale: ja })}`,
      20,
      yPosition
    );
    yPosition += 15;

    // 統計サマリー
    doc.setFontSize(14);
    doc.text('統計サマリー', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    const summaryData = [
      `総記録数: ${statistics.totalRecords}日`,
      `総フォロワー増加: ${statistics.totalFollowerGrowth}人`,
      `平均フォロワー増加: ${statistics.averageFollowerGrowth}人/日`,
      `平均フォローバック率: ${statistics.averageFollowBackRate}%`,
      `総運用時間: ${statistics.totalOperationTime}分`,
      `総いいね数: ${statistics.totalLikes}回`,
    ];

    summaryData.forEach(line => {
      doc.text(line, 25, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // 最近の記録
    doc.setFontSize(14);
    doc.text('最近の記録（直近10日）', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    const recentRecords = records.slice(0, 10);

    recentRecords.forEach((record, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.text(`${index + 1}. ${record.date}`, 25, yPosition);
      yPosition += 5;
      doc.text(
        `   フォロワー: ${record.followersBefore} → ${record.followersAfter} (+${record.followerGrowth || 0})`,
        25,
        yPosition
      );
      yPosition += 5;
      doc.text(
        `   フォローバック率: ${record.followBackRate || 0}% | 運用時間: ${record.operationTime}分`,
        25,
        yPosition
      );
      yPosition += 8;
    });

    // フッター
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `ページ ${i} / ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const defaultFilename = `instagram_report_${format(new Date(), 'yyyyMMdd')}.pdf`;
    doc.save(filename || defaultFilename);
  }

  // サマリーレポートをテキスト形式で生成
  generateTextReport(
    records: InstagramRecord[],
    statistics: StatisticsSummary
  ): string {
    const lines: string[] = [];

    lines.push('='.repeat(50));
    lines.push('Instagram運用レポート');
    lines.push('='.repeat(50));
    lines.push('');
    lines.push(`出力日時: ${format(new Date(), 'yyyy年MM月dd日 HH:mm:ss', { locale: ja })}`);
    lines.push('');
    lines.push('【統計サマリー】');
    lines.push(`総記録数: ${statistics.totalRecords}日`);
    lines.push(`総フォロワー増加: ${statistics.totalFollowerGrowth}人`);
    lines.push(`平均フォロワー増加: ${statistics.averageFollowerGrowth}人/日`);
    lines.push(`平均フォローバック率: ${statistics.averageFollowBackRate}%`);
    lines.push(`総運用時間: ${statistics.totalOperationTime}分`);
    lines.push(`総いいね数: ${statistics.totalLikes}回`);
    lines.push('');

    if (statistics.bestPerformanceDate) {
      lines.push(`最良パフォーマンス日: ${statistics.bestPerformanceDate}`);
    }
    if (statistics.worstPerformanceDate) {
      lines.push(`最低パフォーマンス日: ${statistics.worstPerformanceDate}`);
    }

    lines.push('');
    lines.push('【最近10日間の詳細】');
    lines.push('-'.repeat(50));

    const recentRecords = records.slice(0, 10);
    recentRecords.forEach((record, index) => {
      lines.push(`${index + 1}. ${record.date}`);
      lines.push(`   フォロワー: ${record.followersBefore} → ${record.followersAfter} (+${record.followerGrowth || 0})`);
      lines.push(`   フォロー: ${record.followingBefore} → ${record.followingAfter} (+${record.followingGrowth || 0})`);
      lines.push(`   フォローバック率: ${record.followBackRate || 0}%`);
      lines.push(`   運用時間: ${record.operationTime}分 | いいね数: ${record.likes}回`);
      if (record.otherMemo) {
        lines.push(`   メモ: ${record.otherMemo}`);
      }
      lines.push('');
    });

    lines.push('='.repeat(50));

    return lines.join('\n');
  }

  // ファイルダウンロード
  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // クリップボードにコピー
  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
      throw new Error('クリップボードへのコピーに失敗しました');
    }
  }
}

export const exportService = new ExportService();
