import { useState } from 'react';
import type { InstagramRecord, InstagramAccount } from '../types';
import { dataService } from '../services/dataService';
import { imageAnalysisService } from '../services/imageAnalysisService';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { ImageUpload } from './ImageUpload';
import { format } from 'date-fns';

interface DataInputProps {
  account: InstagramAccount | null;
  onSave: () => void;
}

export const DataInput: React.FC<DataInputProps> = ({ account, onSave }) => {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    postsBefore: '',
    followersBefore: '',
    followingBefore: '',
    postsAfter: '',
    followersAfter: '',
    followingAfter: '',
    startTime: '',
    likes: '',
    mainLoop: '',
    operationTime: '',
    otherMemo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageSelect = (file: File, imageType: 'before' | 'after') => {
    if (imageType === 'before') {
      setBeforeImage(file);
    } else {
      setAfterImage(file);
    }
  };

  const handleAnalyzeImages = async () => {
    if (!beforeImage || !afterImage) {
      alert('運用前と運用後の両方の画像をアップロードしてください');
      return;
    }

    setIsAnalyzing(true);

    try {
      const { before, after } = await imageAnalysisService.analyzeBothScreenshots(
        beforeImage,
        afterImage
      );

      // 解析結果をフォームに反映
      const updateData: Partial<typeof formData> = {};

      if (before.posts !== undefined) updateData.postsBefore = String(before.posts);
      if (before.followers !== undefined) updateData.followersBefore = String(before.followers);
      if (before.following !== undefined) updateData.followingBefore = String(before.following);

      if (after.posts !== undefined) updateData.postsAfter = String(after.posts);
      if (after.followers !== undefined) updateData.followersAfter = String(after.followers);
      if (after.following !== undefined) updateData.followingAfter = String(after.following);

      setFormData(prev => ({ ...prev, ...updateData }));

      alert('画像の解析が完了しました！データが自動入力されました。');
    } catch (error) {
      console.error('画像解析エラー:', error);
      alert(error instanceof Error ? error.message : '画像の解析に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleImageUpload = () => {
    setShowImageUpload(!showImageUpload);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = '日付は必須です';
    if (!formData.followersBefore) newErrors.followersBefore = 'フォロワー数（前）は必須です';
    if (!formData.followersAfter) newErrors.followersAfter = 'フォロワー数（後）は必須です';
    if (!formData.followingBefore) newErrors.followingBefore = 'フォロー数（前）は必須です';
    if (!formData.followingAfter) newErrors.followingAfter = 'フォロー数（後）は必須です';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (!account) {
      alert('先にアカウント情報を設定してください');
      return;
    }

    setSaving(true);

    try {
      const record: InstagramRecord = {
        id: Date.now().toString(),
        date: formData.date,
        postsBefore: parseInt(formData.postsBefore) || 0,
        postsAfter: parseInt(formData.postsAfter) || 0,
        followersBefore: parseInt(formData.followersBefore),
        followersAfter: parseInt(formData.followersAfter),
        followingBefore: parseInt(formData.followingBefore),
        followingAfter: parseInt(formData.followingAfter),
        startTime: formData.startTime,
        likes: parseInt(formData.likes) || 0,
        mainLoop: parseInt(formData.mainLoop) || 0,
        operationTime: parseInt(formData.operationTime) || 0,
        otherMemo: formData.otherMemo,
        accountName: account.accountName,
        accountId: account.accountId,
      };

      await dataService.saveRecord(record);

      // フォームをリセット
      setFormData({
        date: format(new Date(new Date().setDate(new Date().getDate() + 1)), 'yyyy-MM-dd'),
        postsBefore: '',
        followersBefore: '',
        followingBefore: '',
        postsAfter: '',
        followersAfter: '',
        followingAfter: '',
        startTime: '',
        likes: '',
        mainLoop: '',
        operationTime: '',
        otherMemo: '',
      });

      alert('記録を保存しました');
      onSave();
    } catch (error) {
      alert('記録の保存に失敗しました');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="日次記録" subtitle="運用データを記録します">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* AI画像解析セクション */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <span>🤖</span>
                AI画像解析
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                スクリーンショットをアップロードすると、AIが自動でデータを読み取ります
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleToggleImageUpload}
            >
              {showImageUpload ? '閉じる' : '画像をアップロード'}
            </Button>
          </div>

          {showImageUpload && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUpload
                  imageType="before"
                  onImageSelect={handleImageSelect}
                  isAnalyzing={isAnalyzing}
                />
                <ImageUpload
                  imageType="after"
                  onImageSelect={handleImageSelect}
                  isAnalyzing={isAnalyzing}
                />
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={handleAnalyzeImages}
                  disabled={!beforeImage || !afterImage || isAnalyzing}
                  className="w-full md:w-auto"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      解析中...
                    </span>
                  ) : (
                    '画像を解析してデータを自動入力'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div>
          <Input
            label="記録日付"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            error={errors.date}
            required
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-4">運用前データ</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="投稿数"
              type="number"
              name="postsBefore"
              value={formData.postsBefore}
              onChange={handleChange}
              placeholder="0"
            />
            <Input
              label="フォロワー数"
              type="number"
              name="followersBefore"
              value={formData.followersBefore}
              onChange={handleChange}
              error={errors.followersBefore}
              placeholder="0"
              required
            />
            <Input
              label="フォロー数"
              type="number"
              name="followingBefore"
              value={formData.followingBefore}
              onChange={handleChange}
              error={errors.followingBefore}
              placeholder="0"
              required
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-4">運用後データ</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="投稿数"
              type="number"
              name="postsAfter"
              value={formData.postsAfter}
              onChange={handleChange}
              placeholder="0"
            />
            <Input
              label="フォロワー数"
              type="number"
              name="followersAfter"
              value={formData.followersAfter}
              onChange={handleChange}
              error={errors.followersAfter}
              placeholder="0"
              required
            />
            <Input
              label="フォロー数"
              type="number"
              name="followingAfter"
              value={formData.followingAfter}
              onChange={handleChange}
              error={errors.followingAfter}
              placeholder="0"
              required
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-4">運用詳細</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="開始時刻"
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
            />
            <Input
              label="いいね数"
              type="number"
              name="likes"
              value={formData.likes}
              onChange={handleChange}
              placeholder="0"
            />
            <Input
              label="ループ回数"
              type="number"
              name="mainLoop"
              value={formData.mainLoop}
              onChange={handleChange}
              placeholder="0"
            />
            <Input
              label="運用時間（分）"
              type="number"
              name="operationTime"
              value={formData.operationTime}
              onChange={handleChange}
              placeholder="0"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メモ
            </label>
            <textarea
              name="otherMemo"
              value={formData.otherMemo}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="特記事項があれば記入してください"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? '保存中...' : '記録を保存'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
