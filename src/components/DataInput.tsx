import { useState } from 'react';
import type { InstagramRecord, InstagramAccount } from '../types';
import { dataService } from '../services/dataService';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
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

  const handleSubmit = (e: React.FormEvent) => {
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

      dataService.saveRecord(record);

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
