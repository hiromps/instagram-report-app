import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { InstagramRecord } from '../types';
import { Card } from './Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FollowerGrowthChartProps {
  records: InstagramRecord[];
}

export const FollowerGrowthChart: React.FC<FollowerGrowthChartProps> = ({ records }) => {
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const labels = sortedRecords.map(r => r.date);
  const followerData = sortedRecords.map(r => r.followerGrowth || 0);
  const followBackRateData = sortedRecords.map(r => r.followBackRate || 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'フォロワー増加数',
        data: followerData,
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'フォローバック率（%）',
        data: followBackRateData,
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'フォロワー増加数',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'フォローバック率（%）',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (records.length === 0) {
    return (
      <Card title="フォロワー増加トレンド">
        <div className="text-center py-12 text-gray-500">
          データがありません。記録を追加してください。
        </div>
      </Card>
    );
  }

  return (
    <Card title="フォロワー増加トレンド" subtitle="日次のフォロワー増加数とフォローバック率の推移">
      <Line data={data} options={options} />
    </Card>
  );
};
