'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { UploadApiService } from '@/services/entities/upload.service';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

interface TipTapToolbarProps {
  editor: Editor | null;
}

export function TipTapToolbar({ editor }: TipTapToolbarProps) {
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

  return (
    <div className="flex items-center justify-between py-1.5 px-3 bg-slate-50 border-b border-slate-200 select-none text-xs">
      {/* Hidden file input for uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: 'none' }}
      />

      {/* Cụm công cụ cốt lõi trên 1 HÀNG DUY NHẤT: H1 H2 H3 | B I | • 1. “ | + */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Nhóm Tiêu đề Heading */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Tiêu đề chính (H1)"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Mốc sự kiện (H2)"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Tiểu mục (H3)"
          >
            H3
          </button>
        </div>

        <div className="w-[1px] h-4 bg-slate-200 mx-1" />

        {/* Nhóm Định dạng chữ */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-7 h-7 flex items-center justify-center rounded font-bold transition cursor-pointer ${
              editor.isActive('bold')
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="In đậm (Ctrl+B)"
          >
            <b>B</b>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-7 h-7 flex items-center justify-center rounded font-serif italic transition cursor-pointer ${
              editor.isActive('italic')
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="In nghiêng (Ctrl+I)"
          >
            <i>I</i>
          </button>
        </div>

        <div className="w-[1px] h-4 bg-slate-200 mx-1" />

        {/* Nhóm Danh sách & Trích dẫn */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`w-7 h-7 flex items-center justify-center rounded text-sm font-bold transition cursor-pointer ${
              editor.isActive('bulletList')
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Danh sách gạch đầu dòng"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`w-7 h-7 flex items-center justify-center rounded font-bold transition cursor-pointer ${
              editor.isActive('orderedList')
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Danh sách số thứ tự (1, 2, 3)"
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`w-7 h-7 flex items-center justify-center rounded text-base font-serif transition cursor-pointer ${
              editor.isActive('blockquote')
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Khối trích dẫn (Blockquote)"
          >
            “
          </button>
        </div>

        <div className="w-[1px] h-4 bg-slate-200 mx-1" />

        {/* Nút "+" Mở menu chức năng nâng cao (Đúng theo mockup img.png) */}
        <div className="relative inline-block text-left" ref={plusMenuRef}>
          <button
            type="button"
            onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
            className={`w-7 h-7 rounded-md font-bold text-sm flex items-center justify-center border transition-all cursor-pointer ${
              isPlusMenuOpen
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
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

              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  const timeStr = window.prompt('Nhập năm hoặc mốc thời gian (ví dụ: Năm 1954, 07/05/1954):');
                  if (!timeStr || !timeStr.trim()) return;
                  const timelineHtml = ` <span class="wiki-timeline-tag" data-timeline="${timeStr.trim()}">${timeStr.trim()}</span> `;
                  editor.chain().focus().insertContent(timelineHtml).run();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-slate-700 hover:text-amber-800 flex items-center gap-2 cursor-pointer font-medium"
              >
                <span className="text-amber-600">⏱</span>
                <span>Thẻ mốc thời gian</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  const entityName = window.prompt('Nhập tên nhân vật hoặc địa danh (ví dụ: Đại tướng Võ Nguyên Giáp, Đồi A1):');
                  if (!entityName || !entityName.trim()) return;
                  const entityHtml = ` <span class="wiki-entity-tag" data-entity="${entityName.trim()}">${entityName.trim()}</span> `;
                  editor.chain().focus().insertContent(entityHtml).run();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-slate-700 hover:text-purple-800 flex items-center gap-2 cursor-pointer font-medium"
              >
                <span className="text-purple-600">🏛</span>
                <span>Thẻ Nhân vật / Địa danh</span>
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
