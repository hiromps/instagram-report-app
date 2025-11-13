// Supabase Edge Function: Instagram スクリーンショット解析
// Google Gemini APIを使用してスクリーンショットから投稿数、フォロワー数、フォロー数を抽出

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

interface AnalysisResult {
  posts?: number;
  followers?: number;
  following?: number;
  error?: string;
}

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // APIキーの確認
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY が設定されていません');
    }

    // リクエストボディの取得
    const { image, imageType } = await req.json();

    if (!image) {
      throw new Error('画像データが提供されていません');
    }

    // Base64エンコードされた画像データから、プレフィックスとメディアタイプを抽出
    const base64Match = image.match(/^data:image\/(\w+);base64,(.*)$/);
    if (!base64Match) {
      throw new Error('無効な画像データ形式です');
    }

    const mimeType = `image/${base64Match[1]}`;
    const base64Image = base64Match[2];

    // Gemini APIに画像を送信して解析
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `このInstagramのスクリーンショットから以下の情報を正確に抽出してください：

1. 投稿数 (posts)
2. フォロワー数 (followers)
3. フォロー数 (following)

以下のJSON形式で回答してください。数値のみを抽出し、カンマや単位は除いてください：

{
  "posts": <数値>,
  "followers": <数値>,
  "following": <数値>
}

注意事項：
- 数値が見つからない場合は、そのフィールドを省略してください
- 「k」や「m」などの単位がある場合は、実際の数値に変換してください（例: 1.2k → 1200）
- JSONのみを返してください。他のテキストは含めないでください`,
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data, null, 2));

    // レスポンスからテキストを抽出
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini APIからレスポンスを取得できませんでした');
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Gemini APIから有効なコンテンツを取得できませんでした');
    }

    const responseText = candidate.content.parts[0].text.trim();
    console.log('Extracted text:', responseText);

    // JSONを抽出（マークダウンのコードブロックがある場合に対応）
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSONレスポンスが見つかりませんでした');
    }

    const result: AnalysisResult = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '不明なエラーが発生しました',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
