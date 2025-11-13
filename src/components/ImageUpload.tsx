import { useState, useRef } from 'react';
import { Button } from './Button';

interface ImageUploadProps {
  onImageSelect: (file: File, imageType: 'before' | 'after') => void;
  imageType: 'before' | 'after';
  isAnalyzing?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  imageType,
  isAnalyzing = false
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 画像ファイルかチェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    // プレビュー用のURLを作成
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 親コンポーネントに通知
    onImageSelect(file, imageType);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const label = imageType === 'before' ? '運用前のスクショ' : '運用後のスクショ';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-400 transition-colors">
        {preview ? (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={preview}
                alt="プレビュー"
                className="w-full h-48 object-contain rounded-lg bg-gray-50"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <div className="text-sm">AI解析中...</div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClear}
                disabled={isAnalyzing}
                className="flex-1"
              >
                クリア
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClick}
                disabled={isAnalyzing}
                className="flex-1"
              >
                別の画像を選択
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={handleClick}
            className="cursor-pointer text-center py-8"
          >
            <div className="text-4xl mb-2">📸</div>
            <div className="text-sm text-gray-600 mb-1">
              クリックして{label}をアップロード
            </div>
            <div className="text-xs text-gray-500">
              PNG, JPG, JPEG (最大5MB)
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
