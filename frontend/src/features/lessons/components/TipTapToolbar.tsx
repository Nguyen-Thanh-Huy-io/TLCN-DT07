'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { UploadApiService } from '@/services/entities/upload.service';

interface TipTapToolbarProps {
  editor: Editor | null;
}

export function TipTapToolbar({ editor }: TipTapToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaDropdownRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mediaDropdownRef.current &&
        !mediaDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMediaOpen(false);
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
      // Chèn trực tiếp ngay dưới con trỏ chuột, tự nhiên và mượt mà
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

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="tiptap-toolbar !py-1.5 !px-2.5 !gap-1.5 bg-slate-50 border-b border-slate-200">
      {/* Hidden file input for uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: 'none' }}
      />

      {/* 1. Nhóm Tiêu đề gọn gàng */}
      <div className="tiptap-btn-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`tiptap-btn !px-2 !py-1 text-xs font-bold ${editor.isActive('paragraph') ? 'is-active' : ''}`}
          title="Đoạn văn (P)"
        >
          P
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`tiptap-btn !px-2 !py-1 text-xs font-bold ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
          title="Tiêu đề chính (H1)"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`tiptap-btn !px-2 !py-1 text-xs font-bold ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
          title="Mốc sự kiện (H2)"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`tiptap-btn !px-2 !py-1 text-xs font-bold ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
          title="Tiểu mục (H3)"
        >
          H3
        </button>
      </div>

      <div className="tiptap-divider !h-4" />

      {/* 2. Định dạng chữ */}
      <div className="tiptap-btn-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`tiptap-btn !w-7 !h-7 !p-0 ${editor.isActive('bold') ? 'is-active' : ''}`}
          title="In đậm (Ctrl+B)"
        >
          <b>B</b>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`tiptap-btn !w-7 !h-7 !p-0 ${editor.isActive('italic') ? 'is-active' : ''}`}
          title="In nghiêng (Ctrl+I)"
        >
          <i>I</i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`tiptap-btn !w-7 !h-7 !p-0 ${editor.isActive('strike') ? 'is-active' : ''}`}
          title="Gạch ngang"
        >
          <s>S</s>
        </button>
      </div>

      <div className="tiptap-divider !h-4" />

      {/* 3. Danh sách & Trích dẫn */}
      <div className="tiptap-btn-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`tiptap-btn !px-2 !py-1 text-xs ${editor.isActive('bulletList') ? 'is-active' : ''}`}
          title="Danh sách gạch đầu dòng"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`tiptap-btn !px-2 !py-1 text-xs ${editor.isActive('orderedList') ? 'is-active' : ''}`}
          title="Niên biểu (1, 2, 3)"
        >
          1. 2. 3.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`tiptap-btn quote-btn !px-2 !py-1 text-xs ${editor.isActive('blockquote') ? 'is-active' : ''}`}
          title="Khối trích dẫn danh ngôn / Chiếu chỉ"
        >
          ❝ Trích dẫn
        </button>
      </div>

      <div className="tiptap-divider !h-4" />

      {/* 4. Công cụ Sử học chuyên sâu (Ghi chú, Mốc thời gian, Nhân vật) */}
      <div className="tiptap-btn-group">
        <button
          type="button"
          onClick={() => {
            const calloutHtml = `
              <div class="wiki-callout-box">
                <div class="callout-header">💡 Ý nghĩa lịch sử & Đánh giá</div>
                <p>Nhập nội dung tóm tắt hoặc ý nghĩa lịch sử nổi bật tại đây...</p>
              </div>
              <p></p>
            `;
            editor.chain().focus().insertContent(calloutHtml).run();
          }}
          className="tiptap-btn !px-2 !py-1 text-xs text-blue-700 hover:bg-blue-50"
          title="Chèn hộp ghi chú sự kiện / Ý nghĩa lịch sử"
        >
          💡 Ghi chú
        </button>
        <button
          type="button"
          onClick={() => {
            const timeStr = window.prompt('Nhập năm hoặc mốc thời gian (ví dụ: Năm 1954, 07/05/1954):');
            if (!timeStr || !timeStr.trim()) return;
            const timelineHtml = ` <span class="wiki-timeline-tag" data-timeline="${timeStr.trim()}">${timeStr.trim()}</span> `;
            editor.chain().focus().insertContent(timelineHtml).run();
          }}
          className="tiptap-btn !px-2 !py-1 text-xs text-amber-800 hover:bg-amber-50 font-medium"
          title="Chèn thẻ mốc thời gian lịch sử"
        >
          Mốc thời gian
        </button>
        <button
          type="button"
          onClick={() => {
            const entityName = window.prompt('Nhập tên nhân vật hoặc địa danh lịch sử (ví dụ: Đại tướng Võ Nguyên Giáp, Đồi A1):');
            if (!entityName || !entityName.trim()) return;
            const entityHtml = ` <span class="wiki-entity-tag" data-entity="${entityName.trim()}">${entityName.trim()}</span> `;
            editor.chain().focus().insertContent(entityHtml).run();
          }}
          className="tiptap-btn !px-2 !py-1 text-xs text-purple-800 hover:bg-purple-50 font-medium"
          title="Chèn thẻ nhân vật hoặc địa danh lịch sử"
        >
          Nhân vật / Địa danh
        </button>
      </div>

      <div className="tiptap-divider !h-4" />

      {/* 4. Menu Chèn tư liệu (Dropdown gom gọn: Tải ảnh, URL, Video, Link) */}
      <div className="relative inline-block text-left" ref={mediaDropdownRef}>
        <button
          type="button"
          onClick={() => setIsMediaOpen(!isMediaOpen)}
          className={`tiptap-btn !px-2.5 !py-1 text-xs font-semibold flex items-center gap-1.5 border transition-all ${
            isMediaOpen
              ? 'bg-blue-50 text-blue-700 border-blue-300'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="Chèn tư liệu đa phương tiện"
        >
          <span>📎 Chèn tư liệu</span>
          <span className="text-[10px] text-slate-500">▼</span>
        </button>

        {isMediaOpen && (
          <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                setIsMediaOpen(false);
                fileInputRef.current?.click();
              }}
              className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-2 font-medium"
            >
              <span>📤</span>
              <span>{uploading ? 'Đang tải lên...' : 'Tải ảnh từ máy'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMediaOpen(false);
                handleAddImageByUrl();
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
            >
              <span>🖼</span>
              <span>Chèn ảnh từ URL</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMediaOpen(false);
                handleAddYoutube();
              }}
              className="w-full text-left px-3 py-2 hover:bg-red-50 text-slate-700 hover:text-red-700 flex items-center gap-2 font-medium"
            >
              <span>🎬</span>
              <span>Nhúng video YouTube</span>
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
              type="button"
              onClick={() => {
                setIsMediaOpen(false);
                handleSetLink();
              }}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2"
            >
              <span>🔗</span>
              <span>Gắn link tham khảo</span>
            </button>
          </div>
        )}
      </div>

      <div className="tiptap-divider !h-4" />

      {/* 5. Undo / Redo */}
      <div className="tiptap-btn-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="tiptap-btn !w-7 !h-7 !p-0"
          title="Hoàn tác (Undo)"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="tiptap-btn !w-7 !h-7 !p-0"
          title="Làm lại (Redo)"
        >
          ↷
        </button>
      </div>
    </div>
  );
}
