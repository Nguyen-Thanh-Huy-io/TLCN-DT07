'use client';
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import { TipTapToolbar } from './TipTapToolbar';

interface TipTapContentProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TipTapContent({
  value,
  onChange,
  placeholder = 'Nhập nội dung bài học lịch sử chi tiết...',
}: TipTapContentProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
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
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

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

  return (
    <div className="tiptap-editor-wrapper relative">
      {editor && (
        <BubbleMenu
          editor={editor}
          className="tiptap-bubble-menu"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`tiptap-bubble-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
            title="In đậm (Bold)"
          >
            <b>B</b>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`tiptap-bubble-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
            title="In nghiêng (Italic)"
          >
            <i>I</i>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`tiptap-bubble-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
            title="Gạch ngang"
          >
            <s>S</s>
          </button>
          <div className="tiptap-bubble-divider" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`tiptap-bubble-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
            title="Mục sự kiện (H2)"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`tiptap-bubble-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
            title="Trích dẫn"
          >
            "
          </button>
          <div className="tiptap-bubble-divider" />
          <button
            type="button"
            onClick={handleSetLink}
            className={`tiptap-bubble-btn ${editor.isActive('link') ? 'is-active' : ''}`}
            title="Gắn link"
          >
            Link
          </button>
        </BubbleMenu>
      )}
      <TipTapToolbar editor={editor} />
      <div className="tiptap-content-box">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
