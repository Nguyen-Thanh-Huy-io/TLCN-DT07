'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { UploadApiService } from '@/services/entities/upload.service';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { lessonBlockInsertStrategy } from '../strategies/lesson-block-insert.strategy';
import { LessonBlockType } from '../types/block-palette.types';

interface TipTapToolbarProps {
  editor: Editor | null;
  label?: string;
}

export function TipTapToolbar({ editor, label }: TipTapToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        plusMenuRef.current &&
        !plusMenuRef.current.contains(event.target as Node)
      ) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!editor) {
    return null;
  }

  // 1. Tải ảnh trực tiếp từ máy tính cá nhân
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // 2. Chèn ảnh nhanh từ URL ngoài
  const handleAddImageByUrl = () => {
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
  };

  // 3. Nhúng video YouTube trực tiếp
  const handleAddYoutube = () => {
    const url = window.prompt('Dán liên kết video YouTube (ví dụ: https://www.youtube.com/watch?v=...):');
    if (!url || !url.trim()) return;

    let videoSrc = url.trim();
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      videoSrc = `https://www.youtube.com/embed/${id}`;
    } else if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      videoSrc = `https://www.youtube.com/embed/${id}`;
    }

    const figureHtml = `
      <figure class="wiki-media-block">
        <iframe src="${videoSrc}" title="Video tư liệu" allowfullscreen></iframe>
        <figcaption>Nhập chú thích video tại đây...</figcaption>
      </figure>
      <p></p>
    `;
    editor.chain().focus().insertContent(figureHtml).run();
  };

  // 4. Gắn liên kết tham khảo
  const handleSetLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Nhập đường dẫn liên kết tham khảo:', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const currentFormatValue = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
    ? 'h2'
    : editor.isActive('heading', { level: 3 })
    ? 'h3'
    : editor.isActive('blockquote')
    ? 'blockquote'
    : 'p';

  const handleFormatChange = (val: string) => {
    if (val === 'h1') {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    } else if (val === 'h2') {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    } else if (val === 'h3') {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    } else if (val === 'blockquote') {
      editor.chain().focus().toggleBlockquote().run();
    } else {
      editor.chain().focus().setParagraph().run();
    }
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

      {/* Cụm công cụ chuẩn tmp.png: [Label] | [Format v] | [B I U] | [• 1. “] | [🔗 🖼] | [+] */}
      <div className="flex items-center gap-2 flex-wrap">
        {label && (
          <span className="font-bold text-slate-800 text-xs pr-1">
            {label}
          </span>
        )}

        {/* Dropdown Format giống hệt tmp.png */}
        <select
          value={currentFormatValue}
          onChange={(e) => handleFormatChange(e.target.value)}
          aria-label="Định dạng đoạn văn"
          className="h-7 px-2.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
        >
          <option value="p">Format</option>
          <option value="h1">Tiêu đề H1</option>
          <option value="h2">Mốc sự kiện H2</option>
          <option value="h3">Tiểu mục H3</option>
          <option value="blockquote">Khối trích dẫn</option>
        </select>

        {/* Cụm 1: [ B | I | U ] */}
        <div className="inline-flex items-center bg-white border border-slate-300 rounded-md divide-x divide-slate-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-7 h-7 flex items-center justify-center font-bold transition cursor-pointer ${
              editor.isActive('bold')
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="In đậm (Ctrl+B)"
          >
            <b>B</b>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-7 h-7 flex items-center justify-center font-serif italic transition cursor-pointer ${
              editor.isActive('italic')
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="In nghiêng (Ctrl+I)"
          >
            <i>I</i>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`w-7 h-7 flex items-center justify-center transition cursor-pointer ${
              editor.isActive('strike')
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-700 hover:bg-slate-100'
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
              editor.isActive('bulletList')
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Danh sách gạch đầu dòng"
          >
            •≡
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`w-7 h-7 flex items-center justify-center font-bold transition cursor-pointer ${
              editor.isActive('orderedList')
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Danh sách số thứ tự (1, 2, 3)"
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`w-7 h-7 flex items-center justify-center text-sm font-serif transition cursor-pointer ${
              editor.isActive('blockquote')
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Khối trích dẫn (Blockquote)"
          >
            ❝
          </button>
        </div>

        {/* Cụm 3: [ Liên kết | Tải ảnh tư liệu ] giống hệt tmp.png */}
        <div className="inline-flex items-center bg-white border border-slate-300 rounded-md divide-x divide-slate-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={handleSetLink}
            className={`w-7 h-7 flex items-center justify-center transition cursor-pointer ${
              editor.isActive('link')
                ? 'bg-slate-200 text-blue-700'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Chèn liên kết tham khảo"
          >
            🔗
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-7 h-7 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Tải ảnh tư liệu từ máy tính"
          >
            🖼
          </button>
        </div>

        {/* Nút "+" Mở menu chức năng nâng cao */}
        <div className="relative inline-block text-left" ref={plusMenuRef}>
          <button
            type="button"
            onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
            className={`w-7 h-7 rounded-md font-bold text-sm flex items-center justify-center border transition-all cursor-pointer shadow-2xs ${
              isPlusMenuOpen
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
            }`}
            title="Chèn nội dung & công cụ nâng cao"
          >
            +
          </button>

          {isPlusMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in duration-100">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Phương tiện & Đa phương tiện
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 cursor-pointer font-medium"
              >
                <span className="text-slate-400">🖼</span>
                <span>{uploading ? 'Đang tải lên...' : 'Tải ảnh từ máy'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  handleAddImageByUrl();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <span className="text-slate-400">🔗</span>
                <span>Chèn ảnh từ URL</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  handleAddYoutube();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-slate-700 hover:text-red-700 flex items-center gap-2 cursor-pointer font-medium"
              >
                <span className="text-rose-500">▶</span>
                <span>Nhúng video YouTube</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  handleSetLink();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 cursor-pointer"
              >
                <span className="text-blue-500">📎</span>
                <span>Gắn liên kết tham khảo</span>
              </button>

              <div className="my-1 border-t border-slate-100" />
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Chèn khối nội dung (có thể sửa, chọn từ Bách khoa sau khi chèn)
              </div>

              {/* Chèn khối THẬT (cùng cơ chế với khi kéo-thả từ Thư viện khối bên trái) —
                  không phải thẻ chữ tĩnh, bấm vào khối sau khi chèn vẫn sửa được bình
                  thường (đổi tên, chọn liên kết Bách khoa, sửa tóm tắt...). */}
              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  editor.chain().focus().insertContent(lessonBlockInsertStrategy.generateSnippet(LessonBlockType.CHARACTER)).run();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-slate-700 hover:text-purple-800 flex items-center gap-2 cursor-pointer font-medium"
              >
                <span className="text-purple-600">👤</span>
                <span>Khối Nhân vật</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  editor.chain().focus().insertContent(lessonBlockInsertStrategy.generateSnippet(LessonBlockType.EVENT)).run();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-slate-700 hover:text-amber-800 flex items-center gap-2 cursor-pointer font-medium"
              >
                <span className="text-amber-600">🏛</span>
                <span>Khối Sự kiện</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  editor.chain().focus().insertContent(lessonBlockInsertStrategy.generateSnippet(LessonBlockType.TIMELINE)).run();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 cursor-pointer font-medium"
              >
                <span className="text-blue-600">⏱</span>
                <span>Khối Dòng thời gian</span>
              </button>

              <div className="my-1 border-t border-slate-100" />
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Công cụ Sử học chuyên sâu
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  const calloutHtml = `
                    <div class="wiki-callout-box">
                      <div class="callout-header">Ý nghĩa lịch sử & Đánh giá</div>
                      <p>Nhập nội dung tóm tắt hoặc ý nghĩa lịch sử nổi bật tại đây...</p>
                    </div>
                    <p></p>
                  `;
                  editor.chain().focus().insertContent(calloutHtml).run();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 cursor-pointer font-medium"
              >
                <span className="text-blue-600">📜</span>
                <span>Hộp ghi chú sự kiện</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  editor.chain().focus().toggleStrike().run();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <span><s>S</s></span>
                <span>Gạch ngang chữ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  editor.chain().focus().setParagraph().run();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <span className="font-bold">¶</span>
                <span>Chuyển về đoạn văn thường (P)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cụm Undo / Redo gọn gàng ở mép phải */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          title="Hoàn tác (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          title="Làm lại (Ctrl+Y)"
        >
          ↷
        </button>
      </div>
    </div>
  );
}
