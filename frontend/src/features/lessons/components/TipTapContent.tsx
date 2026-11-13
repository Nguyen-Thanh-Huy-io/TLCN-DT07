'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import { TipTapToolbar } from './TipTapToolbar';
import { BlockTypographyExtension, InlineTypographyMark } from '../extensions/typography.extension';
import { useActiveEditor } from '../context/ActiveEditorContext';

interface TipTapContentProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
  compact?: boolean;
  minHeightClass?: string;
  showToolbar?: boolean;
  /** Khi bật trong Studio 3 cột: ẩn thanh toolbar dính trên đầu khối text, chuyển điều khiển sang cột phải Inspector */
  remoteToolbarOnly?: boolean;
}

function createTipTapExtensions(placeholder: string) {
  return [
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
    BlockTypographyExtension,
    InlineTypographyMark,
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
  ];
}

function resolveContentBoxHeightClass(
  remoteToolbarOnly: boolean,
  minHeightClass?: string,
  compact?: boolean,
): string {
  if (remoteToolbarOnly) {
    return '!p-0 !bg-transparent min-h-[100px]';
  }
  if (minHeightClass) {
    return minHeightClass;
  }
  if (compact) {
    return 'min-h-[110px] !border-0 !p-1 focus:outline-none text-base max-w-[65ch]';
  }
  return 'min-h-[280px]';
}

export function TipTapContent({
  value,
  onChange,
  placeholder = 'Nhập nội dung bài học lịch sử chi tiết...',
  label,
  compact = false,
  minHeightClass,
  showToolbar = false,
  remoteToolbarOnly = false,
}: TipTapContentProps) {
  const editorRef = useRef<Editor | null>(null);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const { setActiveEditor } = useActiveEditor();

  const extensions = useMemo(() => createTipTapExtensions(placeholder), [placeholder]);

  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: false,
    onFocus: ({ editor: currentEditor }) => {
      if (remoteToolbarOnly) {
        setActiveEditor(currentEditor);
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
    if (editor && remoteToolbarOnly) {
      setActiveEditor(editor);
    }
  }, [editor, remoteToolbarOnly, setActiveEditor]);

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

  const containerHeightClass = minHeightClass ? '' : compact ? 'min-h-[120px]' : 'min-h-[320px]';
  const boxHeightClass = resolveContentBoxHeightClass(remoteToolbarOnly, minHeightClass, compact);

  return (
    <div
      className={`relative flex-1 flex flex-col ${
        remoteToolbarOnly ? '' : 'tiptap-editor-wrapper'
      } ${containerHeightClass}`}
    >
      {editor && !remoteToolbarOnly && <TipTapBubbleMenu editor={editor} onSetLink={handleSetLink} />}

      {/* Toolbar */}
      {!remoteToolbarOnly &&
        (compact && !showToolbar ? (
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
        ))}

      <div
        className={`tiptap-content-box flex-1 ${
          compact || minHeightClass ? 'tiptap-content-box--compact' : ''
        } ${boxHeightClass} transition-colors relative`}
      >
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}

// --- Merged from TipTapBubbleMenu.tsx ---
interface TipTapBubbleMenuProps {
  editor: Editor;
  onSetLink: () => void;
}

export function TipTapBubbleMenu({ editor, onSetLink }: TipTapBubbleMenuProps) {
  return (
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
        &ldquo;
      </button>
      <div className="tiptap-bubble-divider w-px h-4 bg-slate-700 mx-1" />
      <button
        type="button"
        onClick={onSetLink}
        className={`tiptap-bubble-btn ${editor.isActive('link') ? 'is-active' : ''}`}
        title="Gắn link"
        data-testid="bubble-btn-link"
      >
        Link
      </button>
    </BubbleMenu>
  );
}
