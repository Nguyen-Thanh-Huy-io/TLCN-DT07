'use client';

import React, { useRef, useState } from 'react';
import { Award, ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { UploadApiService } from '@/services/api';
import {
  ACHIEVEMENT_ICON_MAP,
  ACHIEVEMENT_ICON_OPTIONS,
  AchievementMetricType,
  METRIC_TYPE_META,
} from '../../constants/gamification.constants';
import {
  GamificationAdminApiService,
  type AdminAchievementItem,
} from '../../services/gamification.service';
import { AchievementBadgeAvatar } from '../GoalAimModal';

interface AchievementFormModalProps {
  initial?: AdminAchievementItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AchievementFormModal({
  initial,
  onClose,
  onSaved,
}: AchievementFormModalProps) {
  const isEditing = Boolean(initial);
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [iconKey, setIconKey] = useState(initial?.iconKey ?? 'Award');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [metricType, setMetricType] = useState<AchievementMetricType>(
    initial?.metricType ?? AchievementMetricType.TOTAL_ACTIVITIES,
  );
  const [threshold, setThreshold] = useState(initial?.threshold ?? 5);
  const [xpReward, setXpReward] = useState(initial?.xpReward ?? 30);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await UploadApiService.uploadImage(file);
      setImageUrl(uploaded.url);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tải được ảnh huy hiệu lên máy chủ.'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        iconKey,
        imageUrl: imageUrl.trim() || null,
        metricType,
        threshold: Math.max(1, Math.floor(threshold) || 1),
        xpReward: Math.max(0, Math.floor(xpReward) || 0),
        isActive,
      };
      if (isEditing && initial) {
        await GamificationAdminApiService.updateAchievement(initial.id, payload);
      } else {
        await GamificationAdminApiService.createAchievement(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Không lưu được cấu hình huy hiệu.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ach-modal-title"
    >
      <div
        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp thoại huy hiệu"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <AchievementBadgeAvatar
            title={title || 'Huy hiệu'}
            iconKey={iconKey}
            imageUrl={imageUrl.trim() || null}
            sizeClass="size-12"
            iconSize={22}
          />
          <div>
            <h2 id="ach-modal-title" className="text-base font-bold text-slate-900">
              {isEditing ? `Chỉnh sửa huy hiệu: ${initial?.title}` : 'Tạo huy hiệu thành tựu mới'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing && initial
                ? `Mã định danh: ${initial.code}`
                : 'Mã định danh tự sinh từ tên · Hỗ trợ ảnh huy hiệu riêng.'}
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          <label className="block text-xs">
            <span className="font-semibold text-slate-700">Tên huy hiệu</span>
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kiến trúc sư Lịch sử"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#8B261E]"
            />
          </label>

          <label className="block text-xs">
            <span className="font-semibold text-slate-700">Mô tả điều kiện đạt</span>
            <textarea
              required
              rows={2}
              minLength={4}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Xây dựng ít nhất 3 sơ đồ tư duy lịch sử."
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#8B261E]"
            />
          </label>

          {/* Ảnh huy hiệu (tải lên từ máy hoặc dán URL) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-700">Ảnh huy hiệu (khuyên dùng ảnh vuông PNG/SVG)</span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  <Trash2 size={12} /> Gỡ ảnh
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => void handleUploadImage(e)}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                Tải ảnh lên
              </button>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Hoặc dán URL ảnh huy hiệu…"
                className="min-w-[180px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#8B261E]"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500">Biểu tượng thay thế khi chưa có ảnh:</span>
              <div className="mt-1.5 grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {ACHIEVEMENT_ICON_OPTIONS.map((opt) => {
                  const Icon = ACHIEVEMENT_ICON_MAP[opt.key] ?? Award;
                  const active = iconKey === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setIconKey(opt.key)}
                      title={opt.label}
                      className={`flex items-center justify-center rounded-xl border p-2 transition cursor-pointer ${
                        active
                          ? 'border-[#8B261E] bg-red-50 text-[#8B261E]'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={15} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <label className="block text-xs sm:col-span-2">
              <span className="font-semibold text-slate-700">Chỉ số đánh giá</span>
              <select
                value={metricType}
                onChange={(e) => setMetricType(e.target.value as AchievementMetricType)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#8B261E]"
              >
                {Object.entries(METRIC_TYPE_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs">
              <span className="font-semibold text-slate-700">
                Ngưỡng đạt ({METRIC_TYPE_META[metricType].unit})
              </span>
              <input
                type="number"
                min={1}
                max={10000}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#8B261E]"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
            <label className="block text-xs">
              <span className="font-semibold text-slate-700">Điểm thưởng XP</span>
              <input
                type="number"
                min={0}
                max={1000}
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#8B261E]"
              />
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-[#8B261E]"
              />
              <span className="font-semibold text-slate-700">Đang kích hoạt</span>
            </label>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B261E] px-5 py-2 text-xs font-bold text-white hover:bg-[#701D17] disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEditing ? 'Lưu thay đổi' : 'Tạo huy hiệu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
