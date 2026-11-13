'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { UploadApiService } from '@/services/entities/upload.service';

export enum TextFormatType {
  PARAGRAPH = 'p',
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  BLOCKQUOTE = 'blockquote',
}

const BTN_ACTIVE_CLASS = 'bg-slate-200 text-slate-900';
const BTN_INACTIVE_CLASS = 'text-slate-700 hover:bg-slate-100';

const FORMAT_STRATEGIES: Record<TextFormatType, (editor: Editor) => void> = {
  [TextFormatType.H1]: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  [TextFormatType.H2]: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  [TextFormatType.H3]: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  [TextFormatType.BLOCKQUOTE]: (editor) => editor.chain().focus().toggleBlockquote().run(),
  [TextFormatType.PARAGRAPH]: (editor) => editor.chain().focus().setParagraph().run(),
};

function resolveTextFormat(editor: Editor): TextFormatType {
  if (editor.isActive('heading', { level: 1 })) return TextFormatType.H1;
  if (editor.isActive('heading', { level: 2 })) return TextFormatType.H2;
  if (editor.isActive('heading', { level: 3 })) return TextFormatType.H3;
  if (editor.isActive('blockquote')) return TextFormatType.BLOCKQUOTE;
  return TextFormatType.PARAGRAPH;
}

function resolveYoutubeEmbedUrl(url: string): string {
  if (url.includes('youtube.com/watch?v=')) {
    const id = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  return url;
}

interface TipTapToolbarProps {
  editor: Editor | null;
  label?: string;
}

export function TipTapToolbar({ editor, label }: TipTapToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editor) return;
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setUploading(true);
        const res = await UploadApiService.uploadImage(file);
        const figureHtml = `
          <figure class="wiki-media-block">
            <img src="${res.url}" alt="Tư liệu lịch sử" />
            <figcaption>Nhập chú thích ảnh tại đây...</figcaption>
          </figure>
          <p></p>
        `;
        editor.chain().focus().insertContent(figureHtml).run();
      } catch (err) {
        console.error('Upload failed:', err);
        alert('Không thể tải ảnh lên máy chủ. Vui lòng thử lại.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [editor],
  );

  const handleAddImageByUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Dán đường dẫn (URL) hình ảnh tư liệu:');
    if (!url || !url.trim()) return;

    const figureHtml = `
      <figure class="wiki-media-block">
        <img src="${url.trim()}" alt="Tư liệu lịch sử" />
        <figcaption>Nhập chú thích ảnh tại đây...</figcaption>
      </figure>
      <p></p>
    `;
    editor.chain().focus().insertContent(figureHtml).run();
  }, [editor]);

  const handleAddYoutube = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Dán liên kết video YouTube (ví dụ: https://www.youtube.com/watch?v=...):');
    if (!url || !url.trim()) return;

    const videoSrc = resolveYoutubeEmbedUrl(url.trim());
    const figureHtml = `
      <figure class="wiki-media-block">
        <iframe src="${videoSrc}" title="Video tư liệu" allowfullscreen></iframe>
        <figcaption>Nhập chú thích video tại đây...</figcaption>
      </figure>
      <p></p>
    `;
    editor.chain().focus().insertContent(figureHtml).run();
  }, [editor]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Nhập đường dẫn liên kết tham khảo:', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  const currentFormatValue = resolveTextFormat(editor);

  const handleFormatChange = (val: string) => {
    const strategy = FORMAT_STRATEGIES[val as TextFormatType] || FORMAT_STRATEGIES[TextFormatType.PARAGRAPH];
    strategy(editor);
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-slate-100/90 border-b border-slate-200 select-none text-xs gap-2 flex-wrap">
      {/* Hidden file input for uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: 'none' }}
      />

      <div className="flex items-center gap-2 flex-wrap">
        {label && <span className="font-bold text-slate-800 text-xs pr-1">{label}</span>}

        <select
          value={currentFormatValue}
          onChange={(e) => handleFormatChange(e.target.value)}
          aria-label="Định dạng đoạn văn"
          className="h-7 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
        >
          <option value={TextFormatType.PARAGRAPH}>Format</option>
          <option value={TextFormatType.H1}>Tiêu đề H1</option>
          <option value={TextFormatType.H2}>Mốc sự kiện H2</option>
          <option value={TextFormatType.H3}>Tiểu mục H3</option>
          <option value={TextFormatType.BLOCKQUOTE}>Khối trích dẫn</option>
        </select>

        {/* Cụm 1: [ B | I | U ] */}
        <div className="inline-flex items-center bg-white border border-slate-300 rounded-md divide-x divide-slate-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-7 h-7 flex items-center justify-center font-bold transition cursor-pointer ${
              editor.isActive('bold') ? BTN_ACTIVE_CLASS : BTN_INACTIVE_CLASS
            }`}
            title="In đậm (Ctrl+B)"
          >
            <b>B</b>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-7 h-7 flex items-center justify-center font-serif italic transition cursor-pointer ${
              editor.isActive('italic') ? BTN_ACTIVE_CLASS : BTN_INACTIVE_CLASS
            }`}
            title="In nghiêng (Ctrl+I)"
          >
            <i>I</i>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`w-7 h-7 flex items-center justify-center transition cursor-pointer ${
              editor.isActive('strike') ? BTN_ACTIVE_CLASS : BTN_INACTIVE_CLASS
            }`}
            title="Gạch chân / Gạch ngang"
          >
            <span className="underline font-semibold">U</span>
          </button>
        </div>

        {/* Cụm 2: [ Danh sách chấm | Danh sách số | Trích dẫn ] */}
        <div className="inline-flex items-center bg-white border border-slate-300 rounded-md divide-x divide-slate-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`w-7 h-7 flex items-center justify-center text-sm font-bold transition cursor-pointer ${
              editor.isActive('bulletList') ? BTN_ACTIVE_CLASS : BTN_INACTIVE_CLASS
            }`}
            title="Danh sách gạch đầu dòng"
          >
            •≡
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`w-7 h-7 flex items-center justify-center font-bold transition cursor-pointer ${
              editor.isActive('orderedList') ? BTN_ACTIVE_CLASS : BTN_INACTIVE_CLASS
            }`}
            title="Danh sách số thứ tự (1, 2, 3)"
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`w-7 h-7 flex items-center justify-center text-sm font-serif transition cursor-pointer ${
              editor.isActive('blockquote') ? BTN_ACTIVE_CLASS : BTN_INACTIVE_CLASS
            }`}
            title="Khối trích dẫn (Blockquote)"
          >
            &ldquo;
          </button>
        </div>

        {/* Cụm 3: [ Liên kết | Tải ảnh tư liệu ] */}
        <div className="inline-flex items-center bg-white border border-slate-300 rounded-md divide-x divide-slate-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={handleSetLink}
            className={`w-7 h-7 flex items-center justify-center transition cursor-pointer ${
              editor.isActive('link') ? 'bg-slate-200 text-blue-700' : BTN_INACTIVE_CLASS
            }`}
            title="Chèn liên kết tham khảo"
          >
            🔗
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className={`w-7 h-7 flex items-center justify-center ${BTN_INACTIVE_CLASS} transition cursor-pointer`}
            title="Tải ảnh tư liệu từ máy tính"
          >
            🖼
          </button>
        </div>

        <TipTapPlusDropdown
          editor={editor}
          isOpen={isPlusMenuOpen}
          onClose={() => setIsPlusMenuOpen(false)}
          onToggle={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
          onUploadClick={() => fileInputRef.current?.click()}
          onAddImageUrl={handleAddImageByUrl}
          onAddYoutube={handleAddYoutube}
          onSetLink={handleSetLink}
          uploading={uploading}
        />
      </div>
    </div>
  );
}

// --- Merged from TipTapPlusDropdown.tsx ---
interface TipTapPlusDropdownProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  onUploadClick: () => void;
  onAddImageUrl: () => void;
  onAddYoutube: () => void;
  onSetLink: () => void;
  uploading: boolean;
}

export function TipTapPlusDropdown({
  isOpen,
  onClose,
  onToggle,
  onUploadClick,
  onAddImageUrl,
  onAddYoutube,
  onSetLink,
  uploading,
}: TipTapPlusDropdownProps) {
  const plusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="relative inline-block text-left" ref={plusMenuRef}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-7 h-7 rounded-md font-bold text-sm flex items-center justify-center border transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
        }`}
        title="Chèn nội dung & phương tiện"
      >
        +
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in duration-100">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Phương tiện & Đa phương tiện
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              onClose();
              onUploadClick();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 cursor-pointer font-medium"
          >
            <span className="text-slate-400">🖼</span>
            <span>{uploading ? 'Đang tải lên...' : 'Tải ảnh từ máy'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddImageUrl();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
          >
            <span className="text-slate-400">🔗</span>
            <span>Chèn ảnh từ URL</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddYoutube();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-slate-700 hover:text-red-700 flex items-center gap-2 cursor-pointer font-medium"
          >
            <span className="text-rose-500">▶</span>
            <span>Nhúng video YouTube</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSetLink();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 cursor-pointer"
          >
            <span className="text-blue-500">📎</span>
            <span>Gắn liên kết tham khảo</span>
          </button>
        </div>
      )}
    </div>
  );
}
