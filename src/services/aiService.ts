import type {
  AIAnalysisRequest,
  AIAnalysisResponse,
  InstagramRecord
} from '../types';
import { dataService } from './dataService';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

class AIService {
  private apiKey: string | null = null;
  private apiEndpoint = 'https://api.openai.com/v1/chat/completions';

  // APIキーを初期化（async）
  async initialize(): Promise<void> {
    this.apiKey = await dataService.loadApiKey();
  }

  // APIキーを設定
  async setApiKey(key: string): Promise<void> {
    this.apiKey = key;
    await dataService.saveApiKey(key);
  }

  // APIキーを取得
  getApiKey(): string | null {
    return this.apiKey;
  }

  // APIキーが設定されているかチェック
  hasApiKey(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0;
  }

  // AI分析を実行
  async analyzeData(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.hasApiKey()) {
      throw new Error('OpenAI APIキーが設定されていません');
    }

    try {
      const prompt = this.buildAnalysisPrompt(request);
      const response = await this.callOpenAI(prompt);
      return this.parseAIResponse(response, request);
    } catch (error) {
      console.error('AI分析に失敗しました:', error);
      throw new Error('AI分析に失敗しました。APIキーを確認してください。');
    }
  }

  // プロンプトを構築
  private buildAnalysisPrompt(request: AIAnalysisRequest): string {
    const { records, statistics, targetGoal } = request;

    const recentRecords = records.slice(0, 10);

    let prompt = `あなたはInstagram運用の専門家です。以下のデータを分析し、日本語で詳細なレポートを提供してください。

## 統計データ:
- 総記録数: ${statistics.totalRecords}日
- 総フォロワー増加: ${statistics.totalFollowerGrowth}人
- 平均フォロワー増加: ${statistics.averageFollowerGrowth}人/日
- 平均フォローバック率: ${statistics.averageFollowBackRate}%
- 総運用時間: ${statistics.totalOperationTime}分
- 総いいね数: ${statistics.totalLikes}回

## 最近10日間の詳細データ:
${recentRecords.map((r, i) => `
${i + 1}. 日付: ${r.date}
   - フォロワー増加: ${r.followerGrowth || 0}人
   - フォローバック率: ${r.followBackRate || 0}%
   - 運用時間: ${r.operationTime}分
   - いいね数: ${r.likes}回
`).join('')}
`;

    if (targetGoal) {
      prompt += `\n## 目標設定:
- タイプ: ${targetGoal.type === 'follower' ? 'フォロワー数' : targetGoal.type === 'engagement' ? 'エンゲージメント' : '成長率'}
- 目標値: ${targetGoal.value}
- 期間: ${targetGoal.timeframe}
`;
    }

    prompt += `\n## 分析してほしい内容:
1. 全体的なパフォーマンスの評価
2. ポジティブな傾向とネガティブな傾向
3. データから読み取れる具体的な洞察（3-5個）
4. 改善のための推奨アクション（3-5個）
5. 次に取るべき具体的なステップ（3個）

JSON形式で以下の構造で回答してください:
{
  "summary": "全体的な評価の要約（2-3文）",
  "insights": ["洞察1", "洞察2", ...],
  "recommendations": ["推奨1", "推奨2", ...],
  "trends": {
    "positive": ["ポジティブな傾向1", ...],
    "negative": ["ネガティブな傾向1", ...],
    "neutral": ["中立的な観察1", ...]
  },
  "nextActions": ["次のアクション1", "次のアクション2", "次のアクション3"]
}`;

    return prompt;
  }

  // OpenAI APIを呼び出し
  private async callOpenAI(prompt: string): Promise<string> {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'あなたはInstagram運用の専門家で、データ分析に基づいた具体的で実行可能なアドバイスを提供します。'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API エラー: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0].message.content;
  }

  // AI応答をパース
  private parseAIResponse(
    response: string,
    request: AIAnalysisRequest
  ): AIAnalysisResponse {
    try {
      // JSONブロックを抽出
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON形式の応答が見つかりません');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const result: AIAnalysisResponse = {
        summary: parsed.summary || '分析結果を取得できませんでした',
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        trends: {
          positive: Array.isArray(parsed.trends?.positive) ? parsed.trends.positive : [],
          negative: Array.isArray(parsed.trends?.negative) ? parsed.trends.negative : [],
          neutral: Array.isArray(parsed.trends?.neutral) ? parsed.trends.neutral : [],
        },
        nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions : [],
      };

      // 目標設定がある場合は進捗を計算
      if (request.targetGoal) {
        result.goalProgress = this.calculateGoalProgress(
          request.records,
          request.targetGoal
        );
      }

      return result;
    } catch (error) {
      console.error('AI応答のパースに失敗しました:', error);

      // フォールバック: 基本的な分析結果を返す
      return this.generateFallbackAnalysis(request);
    }
  }

  // 目標に対する進捗を計算
  private calculateGoalProgress(
    records: InstagramRecord[],
    targetGoal: { type: string; value: number; timeframe: string }
  ): AIAnalysisResponse['goalProgress'] {
    let current = 0;

    if (targetGoal.type === 'follower') {
      current = records.reduce((sum, r) => sum + (r.followerGrowth || 0), 0);
    } else if (targetGoal.type === 'engagement') {
      current = records.reduce((sum, r) => sum + r.likes, 0);
    } else if (targetGoal.type === 'growth_rate') {
      const validRates = records
        .filter(r => r.followBackRate !== undefined)
        .map(r => r.followBackRate!);
      current = validRates.length > 0
        ? validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length
        : 0;
    }

    const percentage = (current / targetGoal.value) * 100;
    const onTrack = percentage >= 70;

    return {
      current: Math.round(current * 100) / 100,
      target: targetGoal.value,
      percentage: Math.round(percentage * 100) / 100,
      onTrack,
    };
  }

  // フォールバック分析を生成
  private generateFallbackAnalysis(request: AIAnalysisRequest): AIAnalysisResponse {
    const { statistics } = request;

    return {
      summary: `総計${statistics.totalRecords}日間の運用で、フォロワーが${statistics.totalFollowerGrowth}人増加しました。平均フォロワー増加は${statistics.averageFollowerGrowth}人/日です。`,
      insights: [
        `平均フォローバック率は${statistics.averageFollowBackRate}%です`,
        `総運用時間は${statistics.totalOperationTime}分です`,
        `総いいね数は${statistics.totalLikes}回です`,
      ],
      recommendations: [
        'フォローバック率が低い日は、ターゲットユーザーの選定を見直しましょう',
        '最もパフォーマンスが良かった日の運用方法を分析し、再現しましょう',
        '定期的にデータを確認し、トレンドを把握しましょう',
      ],
      trends: {
        positive: ['継続的に記録を残しています'],
        negative: [],
        neutral: [],
      },
      nextActions: [
        '今週のデータを振り返り、改善点を洗い出す',
        'フォローバック率が高い曜日・時間帯を特定する',
        '目標設定を行い、計画的な運用を実施する',
      ],
    };
  }
}

export const aiService = new AIService();
