'use client';

import React, { useRef, useState } from 'react';
import { Loader2, Trash2, Upload, Volume2 } from 'lucide-react';
import api, { extractErrorMessage } from '@/services/api';

interface BlockAudioAttachmentFieldProps {
  audioUrl?: string;
  audioLabel?: string;
  onChange: (updates: { audioUrl?: string; audioLabel?: string }) => void;
  defaultPlaceholder?: string;
}

/**
 * Khối đính kèm âm thanh (ghi chú giọng đọc / lời thoại) tái sử dụng cho CALLOUT và QUOTE.
 * Hỗ trợ dán URL hoặc tải file (.mp3/.wav/.ogg/.m4a) lên qua `/upload/audio` kèm nghe thử.
 */
export function BlockAudioAttachmentField({
  audioUrl,
  audioLabel,
  onChange,
  defaultPlaceholder = 'Ví dụ: Nghe lời đọc Tuyên ngôn Độc lập (2/9/1945)',
}: BlockAudioAttachmentFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(Boolean(audioUrl?.trim()));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url: string | undefined = res.data?.data?.url || res.data?.url;
      if (!url) throw new Error('Không nhận được đường dẫn file âm thanh.');
      onChange({
        audioUrl: url,
        audioLabel: audioLabel || file.name.replace(/\.[^.]+$/, ''),
      });
      setExpanded(true);
    } catch (err) {
      setUploadError(extractErrorMessage(err, 'Không tải lên được file âm thanh.'));
    } finally {
      setUploading(false);
    }
  };

  if (!expanded && !audioUrl?.trim()) {
    return (
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-amber-400 hover:bg-amber-50/60 hover:text-amber-900 cursor-pointer"
        >
          <Volume2 size={13} />
          <span>+ Đính kèm âm thanh / lời thoại</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
          <Volume2 size={13} className="text-amber-700" />
          Âm thanh ghi chú / lời thoại
        </span>
        <button
          type="button"
          onClick={() => {
            onChange({ audioUrl: '', audioLabel: '' });
            setExpanded(false);
            setUploadError(null);
          }}
          title="Gỡ file âm thanh"
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
        >
          <Trash2 size={12} />
          <span>Gỡ</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          type="text"
          value={audioLabel || ''}
          onChange={(e) => onChange({ audioLabel: e.target.value })}
          placeholder={defaultPlaceholder}
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
        />
        <div className="flex items-center gap-1.5">
          <input
            type="url"
            value={audioUrl || ''}
            onChange={(e) => onChange({ audioUrl: e.target.value })}
            placeholder="Dán URL (.mp3, .wav, .ogg, .m4a)..."
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            <span>{uploading ? 'Đang tải...' : 'Tải lên'}</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <p className="text-[11px] font-medium text-rose-600">{uploadError}</p>
      )}

      {audioUrl?.trim() && (
        <audio
          controls
          preload="metadata"
          src={audioUrl.trim()}
          className="h-9 w-full"
        />
      )}
    </div>
  );
}
