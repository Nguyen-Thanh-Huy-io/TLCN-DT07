'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Upload, Link2, Image as ImageIcon, Loader2, X, UserSquare2, Database, Sparkles, Search } from 'lucide-react';
import { UploadApiService } from '@/services/api';
import { extractErrorMessage } from '@/services/api';
import { ImageBlockData, CharacterBlockData, EventBlockData } from '../../types/block-builder.types';
import { ArticleApiService, ArticleItem } from '@/services/entities/article.service';
import { dateLabelOf } from '@/utils/common';
import { CHARACTER_BLOCK_CONSTANTS, EVENT_BLOCK_CONSTANTS } from '../../constants/lesson.constants';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/enums';

function HisgoArticlePickerModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Chọn từ Kho bài viết HISGO',
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (article: ArticleItem) => void;
  title?: string;
}) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      ArticleApiService.list({ search: query.trim() || undefined, limit: 20 })
        .then((res) => {
          if (active) setItems(res.items || []);
        })
        .catch(() => {
          if (active) setItems([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 220);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg flex flex-col max-h-[80vh] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm nhân vật, sự kiện, di tích trong HISGO..."
              className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Đang tìm trong kho HISGO...</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">Không tìm thấy bài viết phù hợp.</div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 truncate">{item.title}</div>
                  <div className="text-xs text-slate-500 line-clamp-1">
                    {item.category?.name ? `${item.category.name} · ` : ''}
                    {dateLabelOf(item) || item.summary || item.slug}
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-700 shrink-0">Chọn</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// --- ImageBlockItemEditor.tsx ---
interface ImageBlockItemEditorProps {
  data: ImageBlockData;
  onChange: (updates: Partial<ImageBlockData>) => void;
}

export function ImageBlockItemEditor({ data, onChange }: ImageBlockItemEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP, JPEG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Dung lượng tệp vượt quá 10MB cho phép.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const res = await UploadApiService.uploadImage(file);
      if (res?.url) {
        onChange({
          src: res.url,
          alt: data.alt || file.name.replace(/\.[^/.]+$/, ''),
        });
      } else {
        setUploadError('Tải ảnh lên thất bại, vui lòng thử lại.');
      }
    } catch (err) {
      setUploadError(extractErrorMessage(err, 'Lỗi kết nối khi tải ảnh lên.'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3 @container min-w-0">
      <div className="flex flex-col @[360px]:flex-row gap-2.5 items-stretch">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 transition disabled:opacity-50 shrink-0"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>Đang tải lên...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-stone-600" />
              <span>Tải ảnh từ máy</span>
            </>
          )}
        </button>

        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={data.src || ''}
            onChange={(e) => onChange({ src: e.target.value })}
            placeholder="Hoặc dán URL hình ảnh tư liệu trực tiếp..."
            className="w-full text-sm pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 bg-white"
          />
        </div>
      </div>

      {uploadError && <p className="text-xs text-red-600 font-medium">{uploadError}</p>}

      {data.src ? (
        <div className="relative group border border-stone-200 rounded-xl overflow-hidden bg-stone-50 p-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.src}
            alt={data.alt || 'Ảnh bài học'}
            className="max-h-64 rounded-lg object-contain mx-auto shadow-xs"
          />
          <button
            type="button"
            onClick={() => onChange({ src: '', caption: '', alt: '' })}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 transition opacity-0 group-hover:opacity-100"
            title="Xóa ảnh"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-stone-200 hover:border-amber-500/50 rounded-xl p-6 text-center cursor-pointer transition bg-stone-50/50 hover:bg-amber-50/20"
        >
          <ImageIcon className="w-8 h-8 mx-auto text-stone-400 mb-2" />
          <p className="text-sm text-stone-600 font-medium">
            Kéo thả hoặc bấm để chọn ảnh tư liệu tải lên
          </p>
          <p className="text-xs text-stone-400 mt-1">Hỗ trợ JPG, PNG, WEBP tối đa 10MB</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          value={data.caption || ''}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Nhập chú thích lịch sử (caption)..."
          className="w-full text-xs italic text-stone-700 bg-white border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-stone-400"
        />
        <input
          type="text"
          value={data.alt || ''}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="Văn bản thay thế (alt text cho SEO)..."
          className="w-full text-xs text-stone-700 bg-white border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-stone-400"
        />
      </div>
    </div>
  );
}

// --- CharacterBlockItemEditor.tsx ---
interface CharacterBlockItemEditorProps {
  data: CharacterBlockData;
  onChange: (updates: Partial<CharacterBlockData>) => void;
}

export function CharacterBlockItemEditor({ data, onChange }: CharacterBlockItemEditorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleSelectEntity = (entity: ArticleItem) => {
    onChange({
      entityId: entity.id,
      name: entity.title,
      years: dateLabelOf(entity),
      summary: entity.summary || '',
      avatarUrl: entity.coverImageUrl || '',
    });
  };

  return (
    <div data-testid="character-block-item-editor" className="space-y-3 font-sans @container min-w-0">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            data-testid="block-character-title"
            className="text-xs font-bold tracking-wider text-stone-700 uppercase"
          >
            Hồ sơ thực thể
          </span>
          {data.entityId && (
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Kho HISGO</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          data-testid="btn-pick-character"
          className="px-2.5 py-1 text-sm font-medium text-stone-800 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          title="Chọn bài viết từ Kho tri thức HISGO"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Chọn từ kho</span>
        </button>
      </div>

      <div className="flex flex-col @[300px]:flex-row items-start gap-3 pt-1">
        <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-300 flex items-center justify-center shrink-0 overflow-hidden text-stone-600">
          {data.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.avatarUrl}
              alt={data.name || 'Nhân vật lịch sử'}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserSquare2 className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0 w-full space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={data.name}
              maxLength={100}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder={CHARACTER_BLOCK_CONSTANTS.NAME_PLACEHOLDER}
              data-testid="input-character-name"
              className="text-base @[300px]:text-lg font-serif font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-900 focus:outline-none py-0.5 flex-1 min-w-0 w-full @[300px]:w-auto"
            />
            <input
              type="text"
              value={data.years}
              maxLength={50}
              onChange={(e) => onChange({ years: e.target.value })}
              placeholder={CHARACTER_BLOCK_CONSTANTS.YEARS_PLACEHOLDER}
              data-testid="input-character-years"
              className="text-xs @[300px]:text-sm font-semibold text-stone-700 bg-stone-100 rounded-md px-2.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-stone-900 w-full @[300px]:w-32 text-left @[300px]:text-center"
            />
          </div>

          <input
            type="text"
            value={data.role || ''}
            maxLength={120}
            onChange={(e) => onChange({ role: e.target.value })}
            placeholder="Vai trò / chức danh (vd: Chủ tướng đại thắng Bạch Đằng)"
            data-testid="input-character-role"
            className="w-full text-sm font-medium text-stone-700 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-900 focus:outline-none py-0.5"
          />
        </div>
      </div>

      <textarea
        rows={3}
        value={data.summary}
        maxLength={500}
        onChange={(e) => onChange({ summary: e.target.value })}
        placeholder={CHARACTER_BLOCK_CONSTANTS.SUMMARY_PLACEHOLDER}
        data-testid="input-character-summary"
        className="w-full text-sm text-stone-700 bg-transparent border border-stone-200/70 hover:border-stone-300 focus:border-stone-900 focus:bg-white focus:outline-none p-2 rounded-lg transition-colors leading-relaxed resize-y"
      />

      <HisgoArticlePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectEntity}
        title="Chọn nhân vật / thực thể từ Kho HISGO"
      />
    </div>
  );
}

// --- EventBlockItemEditor.tsx ---
interface EventBlockItemEditorProps {
  data: EventBlockData;
  onChange: (updates: Partial<EventBlockData>) => void;
}

export function EventBlockItemEditor({ data, onChange }: EventBlockItemEditorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);

  const handleSelectEvent = (event: ArticleItem) => {
    onChange({
      eventId: event.id,
      title: event.title,
      timeLocation: dateLabelOf(event),
      summary: event.summary || '',
      thumbnailUrl: event.coverImageUrl || '',
    });
  };

  return (
    <div data-testid="event-block-item-editor" className="space-y-3 font-sans min-w-0">
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            data-testid="block-event-title"
            className="text-xs font-bold tracking-wider text-slate-700 uppercase"
          >
            {EVENT_BLOCK_CONSTANTS.TITLE}
          </span>
          {data.eventId && (
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Kho sự kiện HISGO</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          data-testid="btn-pick-event"
          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer flex items-center gap-1"
        >
          <Icon name={IconName.SEARCH} size={12} />
          <span>
            {data.eventId
              ? EVENT_BLOCK_CONSTANTS.BTN_CHANGE_EVENT
              : EVENT_BLOCK_CONSTANTS.BTN_PICK_EVENT}
          </span>
        </button>
      </div>

      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 min-w-0">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold tracking-wider text-amber-700 uppercase bg-white inline-block px-2 py-0.5 rounded border border-amber-200">
            {EVENT_BLOCK_CONSTANTS.SUB_LABEL}
          </div>
          <span
            data-testid="event-summary-counter"
            className={`text-[10px] font-mono font-semibold ${
              (data.summary?.length || 0) >= 500
                ? 'text-rose-600 font-bold'
                : (data.summary?.length || 0) > 450
                  ? 'text-amber-600'
                  : 'text-slate-400'
            }`}
          >
            {(data.summary?.length || 0)}/500 ký tự
          </span>
        </div>

        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={EVENT_BLOCK_CONSTANTS.NAME_PLACEHOLDER}
          data-testid="input-event-name"
          className="w-full text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition font-serif"
        />

        <input
          type="text"
          value={data.timeLocation}
          onChange={(e) => onChange({ timeLocation: e.target.value })}
          placeholder={EVENT_BLOCK_CONSTANTS.TIME_LOC_PLACEHOLDER}
          data-testid="input-event-timeloc"
          className="w-full text-xs font-semibold text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition"
        />

        <textarea
          rows={3}
          value={data.summary}
          maxLength={500}
          onChange={(e) => onChange({ summary: e.target.value })}
          placeholder={EVENT_BLOCK_CONSTANTS.SUMMARY_PLACEHOLDER}
          data-testid="input-event-summary"
          className="w-full text-xs text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none p-1.5 rounded transition leading-relaxed resize-y"
        />
      </div>

      <button
        type="button"
        onClick={() => setIsDetailExpanded(!isDetailExpanded)}
        className="text-xs font-semibold text-slate-500 hover:text-amber-700 px-1 flex items-center gap-1 cursor-pointer"
      >
        <span>{isDetailExpanded ? '▲ Thu gọn' : '▼ Thêm chi tiết diễn biến'}</span>
      </button>
      {isDetailExpanded && (
        <textarea
          rows={4}
          value={data.detailContent || ''}
          onChange={(e) => onChange({ detailContent: e.target.value })}
          placeholder="Viết đầy đủ diễn biến sự kiện... (hỗ trợ HTML cơ bản)"
          data-testid="input-event-detail"
          className="w-full text-xs text-slate-700 bg-white border border-slate-200 focus:border-amber-500 focus:outline-none p-2 rounded-lg transition leading-relaxed resize-y"
        />
      )}

      <HisgoArticlePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectEvent}
        title="Chọn sự kiện lịch sử từ Kho HISGO"
      />
    </div>
  );
}
