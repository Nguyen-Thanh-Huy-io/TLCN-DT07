'use client';

import React from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';

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
