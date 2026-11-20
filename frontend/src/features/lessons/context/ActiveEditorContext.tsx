'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Editor } from '@tiptap/react';

export enum BlockSubElementType {
  NESTED_BLOCK = 'NESTED_BLOCK',
}

export type BlockSubElementTypeUnion = `${BlockSubElementType}`;

export interface ActiveSubElementSelection {
  parentBlockId: string;
  subType: BlockSubElementType | BlockSubElementTypeUnion;
  subId?: string;
  label: string;
}

interface ActiveEditorContextValue {
  activeEditor: Editor | null;
  setActiveEditor: (editor: Editor | null) => void;
  /** Tăng lên mỗi khi selection hoặc transaction trong TipTap thay đổi để đồng bộ UI Inspector tức thì */
  editorStateVersion: number;
  /** Cho biết cột phải "Thuộc tính khối" đang hiển thị — khi đang mở thì ẩn Bubble Menu để tránh trùng lặp */
  isInspectorVisible: boolean;
  /** Lưu trạng thái khối con đang được chọn bên trong một khối Bố cục nhiều cột */
  activeSubElement: ActiveSubElementSelection | null;
  setActiveSubElement: (selection: ActiveSubElementSelection | null) => void;
}

const ActiveEditorContext = createContext<ActiveEditorContextValue>({
  activeEditor: null,
  setActiveEditor: () => {},
  editorStateVersion: 0,
  isInspectorVisible: false,
  activeSubElement: null,
  setActiveSubElement: () => {},
});

export function ActiveEditorProvider({
  children,
  isInspectorVisible = false,
}: {
  children: React.ReactNode;
  isInspectorVisible?: boolean;
}) {
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [editorStateVersion, setEditorStateVersion] = useState(0);
  const [activeSubElement, setActiveSubElement] =
    useState<ActiveSubElementSelection | null>(null);

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
      isInspectorVisible,
      activeSubElement,
      setActiveSubElement,
    }),
    [activeEditor, editorStateVersion, isInspectorVisible, activeSubElement]
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
