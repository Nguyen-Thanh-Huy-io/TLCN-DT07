'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link2, MessageSquareQuote } from 'lucide-react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import { TipTapToolbar } from './TipTapToolbar';
import { BlockTypographyExtension, InlineTypographyMark } from '../extensions/typography.extension';
import { RichTableExtensionKit } from '../extensions/table.extension';
import { WikiLinkWithTooltip, FootnoteNode, useActiveEditor } from '../hooks/useLessonAnnotations';
import { TextAnnotationModal, AnnotationModalTab } from './builder/TextAnnotationModal';

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
    ...RichTableExtensionKit,
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
    WikiLinkWithTooltip.configure({
      openOnClick: false,
      autolink: true,
    }),
    FootnoteNode,
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
    return minHeightClass || '!p-0 !bg-transparent min-h-[100px]';
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
  const lastEmittedHtmlRef = useRef<string>(value);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [annotationModal, setAnnotationModal] = useState<{
    open: boolean;
    tab: AnnotationModalTab;
  }>({ open: false, tab: AnnotationModalTab.LINK });
  const { setActiveEditor, isInspectorVisible } = useActiveEditor();

  const extensions = useMemo(() => createTipTapExtensions(placeholder), [placeholder]);

  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        spellcheck: 'false',
      },
    },
    onFocus: ({ editor: currentEditor }) => {
      if (remoteToolbarOnly) {
        setActiveEditor(currentEditor);
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      lastEmittedHtmlRef.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    editorRef.current = editor;
    if (editor && remoteToolbarOnly) {
      setActiveEditor(editor);
    }
  }, [editor, remoteToolbarOnly, setActiveEditor]);

  // Chỉ đồng bộ khi value thay đổi từ bên ngoài (load từ server / khôi phục nháp),
  // tránh gọi setContent lại khi chính editor vừa phát ra onUpdate (làm mất vùng chọn).
  useEffect(() => {
    if (
      editor &&
      value !== undefined &&
      value !== lastEmittedHtmlRef.current &&
      editor.getHTML() !== value
    ) {
      lastEmittedHtmlRef.current = value;
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleSetLink = () => {
    if (!editor) return;
    setAnnotationModal({ open: true, tab: AnnotationModalTab.LINK });
  };

  const handleInsertFootnote = () => {
    if (!editor) return;
    setAnnotationModal({ open: true, tab: AnnotationModalTab.FOOTNOTE });
  };

  const containerHeightClass = minHeightClass ? '' : compact ? 'min-h-[120px]' : 'min-h-[320px]';
  const boxHeightClass = resolveContentBoxHeightClass(remoteToolbarOnly, minHeightClass, compact);

  return (
    <div
      className={`${
        remoteToolbarOnly
          ? 'relative block'
          : 'relative flex-1 flex flex-col tiptap-editor-wrapper'
      } ${containerHeightClass}`}
    >
      {editor && (
        <TipTapBubbleMenu
          editor={editor}
          insertOnly={remoteToolbarOnly && isInspectorVisible}
          onSetLink={handleSetLink}
          onInsertFootnote={handleInsertFootnote}
        />
      )}

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

      <TextAnnotationModal
        editor={editor}
        isOpen={annotationModal.open}
        initialTab={annotationModal.tab}
        onClose={() => setAnnotationModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

// --- Merged from TipTapBubbleMenu.tsx ---
interface TipTapBubbleMenuProps {
  editor: Editor;
  insertOnly?: boolean;
  onSetLink: () => void;
  onInsertFootnote: () => void;
}

export function TipTapBubbleMenu({
  editor,
  insertOnly = false,
  onSetLink,
  onInsertFootnote,
}: TipTapBubbleMenuProps) {
  return (
    <BubbleMenu
      editor={editor}
      className="tiptap-bubble-menu flex items-center flex-row flex-nowrap bg-white text-slate-700 rounded-xl p-1 shadow-lg border border-slate-200 z-50 gap-0.5"
      data-testid="tiptap-bubble-menu"
    >
      {!insertOnly && (
        <>
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
          <div className="tiptap-bubble-divider w-px h-4 bg-slate-200 mx-1" />
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
          <div className="tiptap-bubble-divider w-px h-4 bg-slate-200 mx-1" />
        </>
      )}
      <button
        type="button"
        onClick={onSetLink}
        className={`tiptap-bubble-btn ${editor.isActive('link') ? 'is-active' : ''}`}
        title="Gắn liên kết"
        data-testid="bubble-btn-link"
      >
        <Link2 className="w-3.5 h-3.5" />
        <span>Liên kết</span>
      </button>
      <div className="w-px h-4 bg-slate-200 mx-0.5" />
      <button
        type="button"
        onClick={onInsertFootnote}
        className={`tiptap-bubble-btn ${editor.isActive('footnote') ? 'is-active' : ''}`}
        title="Gắn chú thích đánh số"
        data-testid="bubble-btn-footnote"
      >
        <MessageSquareQuote className="w-3.5 h-3.5" />
        <span>Chú thích</span>
      </button>
    </BubbleMenu>
  );
}
