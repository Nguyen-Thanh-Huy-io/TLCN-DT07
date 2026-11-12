'use client';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import { TipTapToolbar } from './TipTapToolbar';
import { TipTapBubbleMenu } from './TipTapBubbleMenu';
import { LessonBlockType } from '../types/block-palette.types';
import { lessonBlockInsertStrategy } from '../strategies/lesson-block-insert.strategy';
import { ImageBlockExtension } from '../extensions/image-block.extension';
import { VideoBlockExtension } from '../extensions/video-block.extension';
import { TimelineBlockExtension } from '../extensions/timeline-block.extension';
import { CharacterBlockExtension } from '../extensions/character-block.extension';
import { EventBlockExtension } from '../extensions/event-block.extension';
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const { setActiveEditor } = useActiveEditor();

  const extensions = useMemo(() => createTipTapExtensions(placeholder), [placeholder]);

  const editor = useEditor({
    extensions,
    editorProps: {
      handleDrop: (view, event, _slice, moved) => {
        setIsDragOver(false);
        if (moved || !event.dataTransfer) return false;

        const blockType = event.dataTransfer.getData('application/x-lesson-block');
        if (!blockType) return false;

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
        return false;
      },
    },
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
          compact || minHeightClass ? 'tiptap-content-box--compact' : ''
        } ${boxHeightClass} transition-colors relative ${
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
