'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import { TipTapToolbar } from './TipTapToolbar';
import { LessonBlockType } from '../types/block-palette.types';
import { lessonBlockInsertStrategy } from '../strategies/lesson-block-insert.strategy';
import { ImageBlockExtension } from '../extensions/image-block.extension';
import { VideoBlockExtension } from '../extensions/video-block.extension';
import { TimelineBlockExtension } from '../extensions/timeline-block.extension';
import { CharacterBlockExtension } from '../extensions/character-block.extension';
import { EventBlockExtension } from '../extensions/event-block.extension';

interface TipTapContentProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
  compact?: boolean;
}

export function TipTapContent({
  value,
  onChange,
  placeholder = 'Nhập nội dung bài học lịch sử chi tiết...',
  label,
  compact = false,
}: TipTapContentProps) {
  const editorRef = useRef<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        dropcursor: {
          color: '#2563eb',
          width: 4,
          class: 'tiptap-dropcursor-line',
        },
      }),
      ImageBlockExtension,
      VideoBlockExtension,
      TimelineBlockExtension,
      CharacterBlockExtension,
      EventBlockExtension,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Youtube.configure({
        inline: false,
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'tiptap-youtube-video',
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    editorProps: {
      handleDrop: (view, event, _slice, moved) => {
        setIsDragOver(false);
        if (!moved && event.dataTransfer) {
          const blockType = event.dataTransfer.getData('application/x-lesson-block');
          if (blockType) {
            event.preventDefault();
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            if (coordinates && coordinates.pos !== null && editorRef.current) {
              const snippet = lessonBlockInsertStrategy.generateSnippet(blockType as LessonBlockType);
              editorRef.current.chain().focus().insertContentAt(coordinates.pos, snippet).run();
              return true;
            }
          }
        }
        return false;
      },
    },
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Đồng bộ content khi giá trị value từ server nạp xong
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleSetLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Nhập đường dẫn liên kết tham khảo:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);

  return (
    <div
      className={`tiptap-editor-wrapper relative flex-1 flex flex-col ${
        compact ? 'min-h-[160px]' : 'min-h-[480px]'
      }`}
    >
      {editor && (
        <BubbleMenu
          editor={editor}
          className="tiptap-bubble-menu flex items-center flex-row flex-nowrap bg-slate-900 text-white rounded-lg px-1.5 py-1 shadow-xl border border-slate-700/80 z-50 gap-1"
          data-testid="tiptap-bubble-menu"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`tiptap-bubble-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
            title="In đậm (Bold)"
            data-testid="bubble-btn-bold"
          >
            <b>B</b>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`tiptap-bubble-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
            title="In nghiêng (Italic)"
            data-testid="bubble-btn-italic"
          >
            <i>I</i>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`tiptap-bubble-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
            title="Gạch ngang"
            data-testid="bubble-btn-strike"
          >
            <s>S</s>
          </button>
          <div className="tiptap-bubble-divider w-px h-4 bg-slate-700 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`tiptap-bubble-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
            title="Mục sự kiện (H2)"
            data-testid="bubble-btn-h2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`tiptap-bubble-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
            title="Tiểu mục (H3)"
            data-testid="bubble-btn-h3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`tiptap-bubble-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
            title="Trích dẫn"
            data-testid="bubble-btn-quote"
          >
            "
          </button>
          <div className="tiptap-bubble-divider w-px h-4 bg-slate-700 mx-1" />
          <button
            type="button"
            onClick={handleSetLink}
            className={`tiptap-bubble-btn ${editor.isActive('link') ? 'is-active' : ''}`}
            title="Gắn link"
            data-testid="bubble-btn-link"
          >
            Link
          </button>
        </BubbleMenu>
      )}

      {/* Toolbar: Đối với compact mode (khối văn bản tài liệu), mặc định ẩn để viết tự nhiên, chỉ mở khi cần */}
      {compact ? (
        <div className="relative">
          <div className="flex items-center justify-between pb-1 text-xs">
            <span className="text-[11px] text-slate-400 italic">
              Bôi đen văn bản để định dạng nhanh (B, I, H2, Trích dẫn)
            </span>
            <button
              type="button"
              onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
              className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-100 transition cursor-pointer"
              title="Mở thanh công cụ chi tiết"
            >
              <span>{isToolbarExpanded ? '▲ Thu gọn công cụ' : '▼ Công cụ chi tiết'}</span>
            </button>
          </div>
          {isToolbarExpanded && (
            <div className="mb-2 p-1 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in-50 duration-150">
              <TipTapToolbar editor={editor} label={label} />
            </div>
          )}
        </div>
      ) : (
        <TipTapToolbar editor={editor} label={label} />
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDragOver) setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
          }
        }}
        onDrop={() => setIsDragOver(false)}
        className={`tiptap-content-box flex-1 ${
          compact ? 'min-h-[140px] !border-0 !p-1 focus:outline-none' : 'min-h-[420px]'
        } transition-all relative ${
          isDragOver ? 'ring-2 ring-blue-500 bg-blue-50/10' : ''
        }`}
      >
        {isDragOver && (
          <div className="absolute top-3 right-4 z-40 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 pointer-events-none animate-pulse">
            <span>▼</span>
            <span>Đang kéo khối: Rê đến vị trí muốn đặt rồi thả chuột</span>
          </div>
        )}
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
