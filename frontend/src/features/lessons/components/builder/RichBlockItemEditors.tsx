'use client';

import React, { useRef, useState } from 'react';
import { Upload, Link2, Image as ImageIcon, Loader2, X, UserSquare2, Database, Sparkles } from 'lucide-react';
import { UploadApiService } from '@/services/entities/upload.service';
import { extractErrorMessage } from '@/services/api';
import { ImageBlockData, CharacterBlockData, EventBlockData } from '../../types/block-builder.types';
import { EntityPickerModal, EntitySelectionPayload } from '../blocks/EntityPickerModal';
import { ArticleItem } from '@/services/entities/article.service';
import { dateLabelOf } from '@/utils/common';
import { CHARACTER_BLOCK_CONSTANTS, EVENT_BLOCK_CONSTANTS } from '../../constants/lesson.constants';
import { EventPickerModal, EventSelectionPayload } from '../blocks/EventPickerModal';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/enums';

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

    // 10MB limit
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
    <div className="space-y-3">
      {/* Upload Zone & URL Input */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
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

      {uploadError && (
        <p className="text-xs text-red-600 font-medium">{uploadError}</p>
      )}

      {/* Preview Section */}
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

      {/* Caption & Alt Inputs */}
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

  const handleSelectEntity = (entity: EntitySelectionPayload | ArticleItem) => {
    let formattedYears = '';
    const name = 'sourceType' in entity ? entity.name : entity.title;
    let summary = '';
    let avatarUrl = '';
    let entityId: string | undefined = undefined;
    let wikidataId: string | undefined = undefined;
    let sourceUrl: string | undefined = undefined;

    if ('sourceType' in entity) {
      formattedYears = entity.years;
      summary = entity.summary;
      avatarUrl = entity.avatarUrl;
      entityId = entity.entityId;
      wikidataId = entity.wikidataId;
      sourceUrl = entity.sourceUrl;
    } else {
      formattedYears = dateLabelOf(entity);
      summary = entity.summary || '';
      avatarUrl = entity.coverImageUrl || '';
      entityId = entity.id;
    }

    onChange({
      entityId,
      name,
      years: formattedYears,
      summary,
      avatarUrl,
      wikidataId,
      sourceUrl,
    });
  };

  return (
    <div data-testid="character-block-item-editor" className="space-y-3 font-sans">
      {/* Thanh tiêu đề nhỏ gọn + Nút chọn từ kho */}
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
          {data.wikidataId && (
            <span
              data-testid="badge-character-wikidata"
              className="text-xs font-semibold bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md"
            >
              Wikidata: {data.wikidataId}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          data-testid="btn-pick-character"
          className="px-2.5 py-1 text-sm font-medium text-stone-800 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          title="Chọn nhân vật từ Kho tri thức HISGO hoặc Wikipedia"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Chọn từ kho</span>
        </button>
      </div>

      {/* Bố cục Hồ sơ thực thể trực quan (Không lồng card-in-card) */}
      <div className="flex items-start gap-3.5 pt-1">
        {/* Ảnh chân dung */}
        <div className="w-14 h-14 rounded-xl bg-stone-100 border border-stone-300 flex items-center justify-center shrink-0 overflow-hidden text-stone-600">
          {data.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.avatarUrl}
              alt={data.name || 'Nhân vật lịch sử'}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserSquare2 className="w-6 h-6" />
          )}
        </div>

        {/* Tên, Niên đại và Tóm tắt hiển thị trực tiếp */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={data.name}
              maxLength={100}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder={CHARACTER_BLOCK_CONSTANTS.NAME_PLACEHOLDER}
              data-testid="input-character-name"
              className="text-lg font-serif font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-900 focus:outline-none py-0.5 flex-1 min-w-[160px]"
            />
            <input
              type="text"
              value={data.years}
              maxLength={50}
              onChange={(e) => onChange({ years: e.target.value })}
              placeholder={CHARACTER_BLOCK_CONSTANTS.YEARS_PLACEHOLDER}
              data-testid="input-character-years"
              className="text-sm font-semibold text-stone-700 bg-stone-100 rounded-md px-2.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-stone-900 w-32 text-center"
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

          <textarea
            rows={2}
            value={data.summary}
            maxLength={500}
            onChange={(e) => onChange({ summary: e.target.value })}
            placeholder={CHARACTER_BLOCK_CONSTANTS.SUMMARY_PLACEHOLDER}
            data-testid="input-character-summary"
            className="w-full text-sm text-stone-700 bg-transparent border border-transparent hover:border-stone-300 focus:border-stone-900 focus:bg-white focus:outline-none p-1.5 -ml-1.5 rounded-lg transition-colors leading-relaxed resize-y"
          />
        </div>
      </div>

      <EntityPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectEntity={handleSelectEntity}
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

  const handleSelectEvent = (event: EventSelectionPayload | ArticleItem) => {
    if ('sourceType' in event) {
      onChange({
        eventId: event.eventId,
        title: event.title,
        timeLocation: event.timeLocation,
        summary: event.summary,
        thumbnailUrl: event.thumbnailUrl,
        wikidataId: event.wikidataId,
        sourceUrl: event.sourceUrl,
      });
    } else {
      onChange({
        eventId: event.id,
        title: event.title,
        timeLocation: dateLabelOf(event),
        summary: event.summary || '',
        thumbnailUrl: event.coverImageUrl || '',
      });
    }
  };

  return (
    <div data-testid="event-block-item-editor" className="space-y-3 font-sans">
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
          {data.wikidataId && (
            <span
              data-testid="badge-event-wikidata"
              className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Wikidata: {data.wikidataId}</span>
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
            {data.eventId || data.wikidataId
              ? EVENT_BLOCK_CONSTANTS.BTN_CHANGE_EVENT
              : EVENT_BLOCK_CONSTANTS.BTN_PICK_EVENT}
          </span>
        </button>
      </div>

      {/* Thẻ Sự kiện chuẩn img3.png */}
      <div className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold tracking-wider text-amber-700 uppercase bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-200/60">
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

        <div className="relative">
          <textarea
            rows={3}
            value={data.summary}
            maxLength={500}
            onChange={(e) => onChange({ summary: e.target.value })}
            placeholder={EVENT_BLOCK_CONSTANTS.SUMMARY_PLACEHOLDER}
            data-testid="input-event-summary"
            className="w-full text-xs text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none p-1.5 pb-5 rounded transition leading-relaxed resize-y"
          />
          <div
            data-testid="event-summary-counter"
            className={`text-[10px] text-right px-1 select-none font-medium ${
              (data.summary?.length || 0) >= 480 ? 'text-amber-600 font-bold' : 'text-slate-400'
            }`}
          >
            {data.summary?.length || 0}/500 ký tự
          </div>
        </div>
      </div>

      <p
        data-testid="event-block-difference-note"
        className="text-[11px] text-slate-500 px-1 italic"
      >
        {EVENT_BLOCK_CONSTANTS.DIFFERENCE_NOTE}
      </p>

      {/* Chi tiết tuỳ chọn — ẩn mặc định ở bản Xem trước, chỉ xổ ra khi bấm "Xem chi tiết".
          Dùng khi 500 ký tự tóm tắt không đủ để viết đầy đủ diễn biến sự kiện. */}
      <button
        type="button"
        onClick={() => setIsDetailExpanded(!isDetailExpanded)}
        className="text-xs font-semibold text-slate-500 hover:text-amber-700 px-1 flex items-center gap-1 cursor-pointer"
      >
        <span>{isDetailExpanded ? '▲ Thu gọn' : '▼ Thêm chi tiết diễn biến'}</span>
      </button>
      {isDetailExpanded && (
        <div className="animate-in fade-in-50 duration-150">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Chi tiết diễn biến (tuỳ chọn — chỉ hiện khi bấm &quot;Xem chi tiết&quot;):
          </label>
          <textarea
            rows={4}
            value={data.detailContent || ''}
            onChange={(e) => onChange({ detailContent: e.target.value })}
            placeholder="Viết đầy đủ diễn biến sự kiện... (không giới hạn độ dài, hỗ trợ HTML cơ bản)"
            data-testid="input-event-detail"
            className="w-full text-xs text-slate-700 bg-white border border-slate-200 focus:border-amber-500 focus:outline-none p-2 rounded-lg transition leading-relaxed resize-y"
          />
        </div>
      )}

      <EventPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectEvent={handleSelectEvent}
      />
    </div>
  );
}
