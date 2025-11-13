import { supabase } from '../lib/supabaseClient';

export interface ImageAnalysisResult {
  posts?: number;
  followers?: number;
  following?: number;
  error?: string;
}

class ImageAnalysisService {
  /**
   * 画像をBase64に変換
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Instagramのスクリーンショットを解析
   */
  async analyzeScreenshot(
    file: File,
    imageType: 'before' | 'after'
  ): Promise<ImageAnalysisResult> {
    try {
      // ファイルをBase64に変換
      const base64Image = await this.fileToBase64(file);

      // Supabase Edge Functionを呼び出し
      const { data, error } = await supabase.functions.invoke(
        'analyze-instagram-screenshot',
        {
          body: {
            image: base64Image,
            imageType,
          },
        }
      );

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(`画像の解析に失敗しました: ${error.message}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as ImageAnalysisResult;
    } catch (error) {
      console.error('Image analysis error:', error);
      throw error instanceof Error
        ? error
        : new Error('画像の解析中に不明なエラーが発生しました');
    }
  }

  /**
   * 2枚の画像（運用前・運用後）を同時に解析
   */
  async analyzeBothScreenshots(
    beforeFile: File,
    afterFile: File
  ): Promise<{
    before: ImageAnalysisResult;
    after: ImageAnalysisResult;
  }> {
    try {
      // 並列で解析を実行
      const [before, after] = await Promise.all([
        this.analyzeScreenshot(beforeFile, 'before'),
        this.analyzeScreenshot(afterFile, 'after'),
      ]);

      return { before, after };
    } catch (error) {
      console.error('Batch analysis error:', error);
      throw error instanceof Error
        ? error
        : new Error('画像の一括解析中にエラーが発生しました');
    }
  }
}

export const imageAnalysisService = new ImageAnalysisService();
