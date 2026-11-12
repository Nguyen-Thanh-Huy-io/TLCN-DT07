'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Editor } from '@tiptap/react';

export enum EditorialSubElementType {
  INTRO_TEXT = 'INTRO_TEXT',
  MAIN_HEADING = 'MAIN_HEADING',
  ARTICLE_TEXT = 'ARTICLE_TEXT',
  MAIN_IMAGE = 'MAIN_IMAGE',
  PULL_QUOTE = 'PULL_QUOTE',
  SUB_CHAPTER = 'SUB_CHAPTER',
  NESTED_BLOCK = 'NESTED_BLOCK',
}

export type EditorialSubElementTypeUnion = `${EditorialSubElementType}`;

export interface ActiveSubElementSelection {
  parentBlockId: string;
  subType: EditorialSubElementType | EditorialSubElementTypeUnion;
  subId?: string;
  label: string;
}

interface ActiveEditorContextValue {
  activeEditor: Editor | null;
  setActiveEditor: (editor: Editor | null) => void;
  /** Tăng lên mỗi khi selection hoặc transaction trong TipTap thay đổi để đồng bộ UI Inspector tức thì */
  editorStateVersion: number;
  /** Lưu trạng thái ô/khối con đang được chọn bên trong một khối phức hợp (VD: Editorial Spread / Bố cục nhiều cột) */
  activeSubElement: ActiveSubElementSelection | null;
  setActiveSubElement: (selection: ActiveSubElementSelection | null) => void;
  /** Lưu ID chương (Chapter) đang được chọn bên trong khối Story nhiều chương */
  activeChapterId: string | null;
  setActiveChapterId: (chapterId: string | null) => void;
}

const ActiveEditorContext = createContext<ActiveEditorContextValue>({
  activeEditor: null,
  setActiveEditor: () => {},
  editorStateVersion: 0,
  activeSubElement: null,
  setActiveSubElement: () => {},
  activeChapterId: null,
  setActiveChapterId: () => {},
});

export function ActiveEditorProvider({ children }: { children: React.ReactNode }) {
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [editorStateVersion, setEditorStateVersion] = useState(0);
  const [activeSubElement, setActiveSubElement] =
    useState<ActiveSubElementSelection | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeEditor) return;

    const handleTransaction = () => {
      setEditorStateVersion((v) => v + 1);
    };

    activeEditor.on('selectionUpdate', handleTransaction);
    activeEditor.on('transaction', handleTransaction);

    return () => {
      activeEditor.off('selectionUpdate', handleTransaction);
      activeEditor.off('transaction', handleTransaction);
    };
  }, [activeEditor]);

  const value = useMemo(
    () => ({
      activeEditor,
      setActiveEditor,
      editorStateVersion,
      activeSubElement,
      setActiveSubElement,
      activeChapterId,
      setActiveChapterId,
    }),
    [activeEditor, editorStateVersion, activeSubElement, activeChapterId]
  );

  return (
    <ActiveEditorContext.Provider value={value}>
      {children}
    </ActiveEditorContext.Provider>
  );
}

export function useActiveEditor() {
  return useContext(ActiveEditorContext);
}
