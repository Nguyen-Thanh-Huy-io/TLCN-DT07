'use client';

import React, { useState } from 'react';
import {
  ListOrdered,
  Quote,
  Eraser,
  Code2,
  Link2,
  MessageSquareQuote,
  Table2,
} from 'lucide-react';
import {
  HISGO_FONT_FAMILIES,
  INSPECTOR_COLOR_INPUT_CLS,
  INSPECTOR_SEG_BTN_ACTIVE,
  INSPECTOR_SEG_BTN_IDLE,
  INSPECTOR_SEG_GROUP_CLS,
  INSPECTOR_SELECT_CLS,
  InspectorAccordionSection,
  InspectorFieldRow,
  InspectorToggleSwitch,
  TextAlignMode,
  TextStyleControls,
  type TextStyleValue,
} from '@/components/common/TextStyleControls';
import { useActiveEditor } from '../../../context/ActiveEditorContext';
import {
  RICH_TABLE_NODE_NAMES,
  insertRichTable,
} from '../../../extensions/table.extension';
import { TextAnnotationModal, AnnotationModalTab } from '../TextAnnotationModal';
import { WikiLinkInspectorSection } from '../WikiLinkInspectorSection';
import {
  BulletListIcon,
  TypographyListStyleControl,
  TypographyTableControls,
} from './TypographyListAndTablePanels';

export enum TipTapBlockStyle {
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  BLOCKQUOTE = 'blockquote',
  CODE_BLOCK = 'codeBlock',
  LEAD = 'lead',
  PARAGRAPH = 'paragraph',
}

const NODE_TYPE_PARAGRAPH = 'paragraph';
const NODE_TYPE_HEADING = 'heading';
const TOOL_CLEAR = 'clear';
const HIGHLIGHT_DEFAULT_HEX = '#fef08a';

const LINE_HEIGHT_OPTIONS = ['120%', '140%', '160%', '180%', '200%'] as const;
const TEXT_COLUMN_OPTIONS = [1, 2, 3] as const;

function getActiveBlockStyle(
  ed: ReturnType<typeof useActiveEditor>['activeEditor']
): TipTapBlockStyle {
  if (!ed) return TipTapBlockStyle.PARAGRAPH;
  if (ed.isActive('heading', { level: 1 })) return TipTapBlockStyle.H1;
  if (ed.isActive('heading', { level: 2 })) return TipTapBlockStyle.H2;
  if (ed.isActive('heading', { level: 3 })) return TipTapBlockStyle.H3;
  if (ed.isActive('blockquote')) return TipTapBlockStyle.BLOCKQUOTE;
  if (ed.isActive('codeBlock')) return TipTapBlockStyle.CODE_BLOCK;
  return TipTapBlockStyle.PARAGRAPH;
}

function applyTipTapBlockStyle(
  ed: ReturnType<typeof useActiveEditor>['activeEditor'],
  val: string
) {
  if (!ed) return;
  const chain = ed.chain().focus();
  switch (val) {
    case TipTapBlockStyle.H1:
      chain.toggleHeading({ level: 1 }).run();
      break;
    case TipTapBlockStyle.H2:
      chain.toggleHeading({ level: 2 }).run();
      break;
    case TipTapBlockStyle.H3:
      chain.toggleHeading({ level: 3 }).run();
      break;
    case TipTapBlockStyle.BLOCKQUOTE:
      chain.toggleBlockquote().run();
      break;
    case TipTapBlockStyle.CODE_BLOCK:
      chain.toggleCodeBlock().run();
      break;
    case TipTapBlockStyle.LEAD:
      chain
        .setParagraph()
        .updateAttributes(NODE_TYPE_PARAGRAPH, { leadParagraph: true })
        .run();
      break;
    default:
      chain
        .setParagraph()
        .updateAttributes(NODE_TYPE_PARAGRAPH, { leadParagraph: false })
        .run();
      break;
  }
}

function dispatchTipTapTextStylePatch({
  ed,
  patch,
  applyInlineAttr,
  applyNodeAttr,
}: {
  ed: ReturnType<typeof useActiveEditor>['activeEditor'];
  patch: Partial<TextStyleValue>;
  applyInlineAttr: (updates: Record<string, string | null>, shouldFocus?: boolean) => void;
  applyNodeAttr: (updates: Record<string, unknown>) => void;
}) {
  if (!ed) return;
  if (patch.fontFamily !== undefined) applyInlineAttr({ fontFamily: patch.fontFamily });
  if (patch.fontSize !== undefined) applyInlineAttr({ fontSize: `${patch.fontSize}px` }, false);
  if (patch.textColor !== undefined) applyInlineAttr({ color: patch.textColor }, false);
  if (patch.bold !== undefined) ed.chain().focus().toggleBold().run();
  if (patch.italic !== undefined) ed.chain().focus().toggleItalic().run();
  if (patch.underline !== undefined) ed.chain().focus().toggleUnderline().run();
  if (patch.strike !== undefined) ed.chain().focus().toggleStrike().run();
  if (patch.textAlign !== undefined) applyNodeAttr({ textAlign: patch.textAlign });
}

function getParagraphEditorialAttrs(
  ed: ReturnType<typeof useActiveEditor>['activeEditor']
): { dropCap: boolean; textColumns: 1 | 2 | 3 } {
  if (!ed) return { dropCap: false, textColumns: 1 };
  if (ed.isActive(NODE_TYPE_PARAGRAPH)) {
    const attrs = ed.getAttributes(NODE_TYPE_PARAGRAPH);
    return {
      dropCap: Boolean(attrs.dropCap),
      textColumns: (Number(attrs.textColumns) || 1) as 1 | 2 | 3,
    };
  }
  let found = { dropCap: false, textColumns: 1 as 1 | 2 | 3 };
  ed.state.doc.descendants((node) => {
    if (node.type.name === NODE_TYPE_PARAGRAPH) {
      found = {
        dropCap: Boolean(node.attrs.dropCap),
        textColumns: (Number(node.attrs.textColumns) || 1) as 1 | 2 | 3,
      };
      return false;
    }
    return true;
  });
  return found;
}

function applyParagraphEditorialAttr(
  ed: ReturnType<typeof useActiveEditor>['activeEditor'],
  updates: Record<string, unknown>
) {
  if (!ed) return;
  if (ed.isActive(NODE_TYPE_PARAGRAPH)) {
    ed.chain().focus().updateAttributes(NODE_TYPE_PARAGRAPH, updates).run();
    return;
  }
  const { tr, doc } = ed.state;
  let updated = false;
  doc.descendants((node, pos) => {
    if (node.type.name === NODE_TYPE_PARAGRAPH) {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...updates });
      updated = true;
      if ('dropCap' in updates) return false;
    }
    return true;
  });
  if (updated) {
    ed.view.dispatch(tr);
  }
}

function TypographyEditorialSection({
  ed,
  isDropCapActive,
  currentTextColumns,
  preventFocusLoss,
}: {
  ed: ReturnType<typeof useActiveEditor>['activeEditor'];
  isDropCapActive: boolean;
  currentTextColumns: 1 | 2 | 3;
  preventFocusLoss: (e: React.MouseEvent) => void;
}) {
  return (
    <InspectorAccordionSection title="Dàn trang tạp chí">
      <InspectorFieldRow label="Chữ đầu lớn (Drop Cap)">
        <InspectorToggleSwitch
          ariaLabel="Chữ cái đầu đoạn lớn (Drop Cap)"
          checked={isDropCapActive}
          disabled={!ed}
          onChange={(next) => applyParagraphEditorialAttr(ed, { dropCap: next })}
        />
      </InspectorFieldRow>

      <InspectorFieldRow label="Chia cột đoạn văn">
        <div className={`grid w-28 grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}>
          {TEXT_COLUMN_OPTIONS.map((cols) => (
            <button
              key={cols}
              type="button"
              onMouseDown={preventFocusLoss}
              disabled={!ed}
              onClick={() => applyParagraphEditorialAttr(ed, { textColumns: cols })}
              className={`grid h-7 place-items-center text-[11px] transition cursor-pointer disabled:opacity-40 ${
                currentTextColumns === cols ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
              }`}
            >
              {cols}
            </button>
          ))}
        </div>
      </InspectorFieldRow>
    </InspectorAccordionSection>
  );
}

/**
 * Bảng điều khiển Định dạng Chữ & Dàn trang Tạp chí (Rich Text Typography Inspector).
 * Hợp nhất và tái sử dụng trực tiếp `TextStyleControls` & `InspectorAccordionSection` chuẩn Mindmap.
 */
export function TypographyInspectorPanel({
  compact = false,
  hideEditorialLayout = false,
}: {
  compact?: boolean;
  accentColor?: string;
  hideEditorialLayout?: boolean;
}) {
  const { activeEditor: ed } = useActiveEditor();
  const [isLinkPanelOpen, setIsLinkPanelOpen] = useState(false);
  const [annotationModal, setAnnotationModal] = useState<{
    open: boolean;
    tab: AnnotationModalTab;
  }>({ open: false, tab: AnnotationModalTab.LINK });

  const activeBlockType = getActiveBlockStyle(ed);
  const nodeType = ed?.isActive('heading') ? NODE_TYPE_HEADING : NODE_TYPE_PARAGRAPH;
  const nodeAttrs = ed?.getAttributes(nodeType) || {};
  const markAttrs = ed?.getAttributes('inlineTypography') || {};

  const currentAlign = (nodeAttrs.textAlign as TextAlignMode) || TextAlignMode.LEFT;
  const currentLineHeight = (nodeAttrs.lineHeight as string) || '160%';
  const paragraphEditorial = getParagraphEditorialAttrs(ed);
  const isDropCapActive = paragraphEditorial.dropCap;
  const isLeadParagraphActive = Boolean(nodeAttrs.leadParagraph);
  const currentTextColumns = paragraphEditorial.textColumns;
  const currentFont =
    (markAttrs.fontFamily as string) || HISGO_FONT_FAMILIES[0].value;
  const currentSizePx =
    parseInt(String(markAttrs.fontSize || '16').replace('px', ''), 10) || 16;
  const currentColor = (markAttrs.color as string) || '#1E293B';
  const currentBgColor = (markAttrs.backgroundColor as string) || '';

  const applyInlineAttr = (updates: Record<string, string | null>, shouldFocus = true) => {
    if (!ed) return;
    const merged = { ...markAttrs, ...updates };
    const chain = ed.chain();
    if (shouldFocus) chain.focus();
    chain.setMark('inlineTypography', merged).run();
  };

  const applyNodeAttr = (updates: Record<string, unknown>) => {
    if (!ed) return;
    ed.chain().focus().updateAttributes(nodeType, updates).run();
  };

  const preventFocusLoss = (e: React.MouseEvent) => e.preventDefault();

  const blockStyleSelectValue =
    activeBlockType === TipTapBlockStyle.PARAGRAPH && isLeadParagraphActive
      ? TipTapBlockStyle.LEAD
      : activeBlockType;

  const extraTools = [
    {
      key: 'orderedList',
      title: 'Danh sách đánh số',
      Icon: ListOrdered,
      run: () => ed?.chain().focus().toggleOrderedList().run(),
    },
    {
      key: 'bulletList',
      title: 'Danh sách chấm đầu dòng (Bullet)',
      Icon: BulletListIcon,
      run: () => ed?.chain().focus().toggleBulletList().run(),
    },
    {
      key: 'blockquote',
      title: 'Trích dẫn đoạn văn',
      Icon: Quote,
      run: () => ed?.chain().focus().toggleBlockquote().run(),
    },
    {
      key: 'code',
      title: 'Thuật ngữ',
      Icon: Code2,
      run: () => ed?.chain().focus().toggleCode().run(),
    },
    {
      key: TOOL_CLEAR,
      title: 'Xóa mọi định dạng',
      Icon: Eraser,
      run: () => ed?.chain().focus().unsetAllMarks().clearNodes().run(),
    },
  ];

  return (
    <div className="space-y-3.5 text-xs text-slate-700">
      <InspectorAccordionSection title="Văn bản">
        <TextStyleControls
          disabled={!ed}
          showUnderline={!compact}
          showCaseTransform={false}
          allowJustify={!compact}
          onButtonMouseDown={preventFocusLoss}
          value={{
            fontFamily: currentFont,
            fontSize: currentSizePx,
            textColor: currentColor,
            bold: Boolean(ed?.isActive('bold')),
            italic: Boolean(ed?.isActive('italic')),
            underline: Boolean(ed?.isActive('underline')),
            strike: Boolean(ed?.isActive('strike')),
            textAlign: currentAlign,
          }}
          defaultFontSize={16}
          defaultColor="#1E293B"
          onChange={(patch) =>
            dispatchTipTapTextStylePatch({
              ed,
              patch,
              applyInlineAttr,
              applyNodeAttr,
            })
          }
          topSlot={
            !compact ? (
              <InspectorFieldRow label="Kiểu đoạn">
                <select
                  aria-label="Kiểu đoạn văn"
                  value={blockStyleSelectValue}
                  onChange={(e) => applyTipTapBlockStyle(ed, e.target.value)}
                  disabled={!ed}
                  className={`${INSPECTOR_SELECT_CLS} w-40 max-w-[165px]`}
                >
                  <option value={TipTapBlockStyle.PARAGRAPH}>Đoạn văn thường</option>
                  <option value={TipTapBlockStyle.LEAD}>Đoạn dẫn nhập</option>
                  <option value={TipTapBlockStyle.H1}>Tiêu đề chính (H1)</option>
                  <option value={TipTapBlockStyle.H2}>Tiêu đề mục (H2)</option>
                  <option value={TipTapBlockStyle.H3}>Tiêu đề phụ (H3)</option>
                  <option value={TipTapBlockStyle.BLOCKQUOTE}>Khối trích dẫn</option>
                  <option value={TipTapBlockStyle.CODE_BLOCK}>Khối tư liệu gốc</option>
                </select>
              </InspectorFieldRow>
            ) : undefined
          }
        />

        {/* Hàng nút Danh sách & Công cụ định dạng bổ sung */}
        <div className={`grid grid-cols-5 ${INSPECTOR_SEG_GROUP_CLS}`}>
          {extraTools.map(({ key, title, Icon, run }) => {
            const active = key !== TOOL_CLEAR && Boolean(ed?.isActive(key));
            return (
              <button
                key={key}
                type="button"
                data-testid={`inspector-tool-${key}`}
                disabled={!ed}
                onMouseDown={preventFocusLoss}
                onClick={run}
                title={title}
                className={`grid h-8 place-items-center transition cursor-pointer disabled:opacity-40 ${
                  active ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
                }`}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>

        {/* Bộ chọn Kiểu dấu đầu dòng / Kiểu đánh số khi đang trong danh sách */}
        <TypographyListStyleControl
          editor={ed}
          preventFocusLoss={preventFocusLoss}
        />

        {/* Hàng nút Gắn Liên kết, Chú thích & Bảng biểu trực tiếp trên Inspector */}
        {!compact && (
          <div className={`grid grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}>
            <button
              type="button"
              disabled={!ed}
              onMouseDown={preventFocusLoss}
              onClick={() =>
                setAnnotationModal({ open: true, tab: AnnotationModalTab.LINK })
              }
              className={`flex h-8 items-center justify-center gap-1 text-[11px] font-semibold transition cursor-pointer disabled:opacity-40 ${
                ed?.isActive('link') ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
              }`}
            >
              <Link2 size={13} />
              <span>Liên kết</span>
            </button>
            <button
              type="button"
              disabled={!ed}
              onMouseDown={preventFocusLoss}
              onClick={() =>
                setAnnotationModal({ open: true, tab: AnnotationModalTab.FOOTNOTE })
              }
              className={`flex h-8 items-center justify-center gap-1 text-[11px] font-semibold transition cursor-pointer disabled:opacity-40 ${
                ed?.isActive('footnote')
                  ? INSPECTOR_SEG_BTN_ACTIVE
                  : INSPECTOR_SEG_BTN_IDLE
              }`}
            >
              <MessageSquareQuote size={13} />
              <span>Chú thích</span>
            </button>
            <button
              type="button"
              data-testid="inspector-btn-table"
              disabled={!ed}
              onMouseDown={preventFocusLoss}
              onClick={() =>
                insertRichTable(ed, { rows: 3, cols: 3, withHeaderRow: true })
              }
              title="Chèn bảng dữ liệu (3×3)"
              className={`flex h-8 items-center justify-center gap-1 text-[11px] font-semibold transition cursor-pointer disabled:opacity-40 ${
                ed?.isActive(RICH_TABLE_NODE_NAMES.TABLE)
                  ? INSPECTOR_SEG_BTN_ACTIVE
                  : INSPECTOR_SEG_BTN_IDLE
              }`}
            >
              <Table2 size={13} />
              <span>Bảng</span>
            </button>
          </div>
        )}

        {/* Khay thao tác Hàng / Cột / Tiêu đề khi con trỏ đang nằm trong bảng */}
        <TypographyTableControls
          editor={ed}
          preventFocusLoss={preventFocusLoss}
        />

        {!compact && (
          <>
            <InspectorFieldRow label="Giãn dòng">
              <select
                aria-label="Giãn dòng"
                disabled={!ed}
                value={currentLineHeight}
                onChange={(e) => applyNodeAttr({ lineHeight: e.target.value })}
                className={`${INSPECTOR_SELECT_CLS} w-24`}
              >
                {LINE_HEIGHT_OPTIONS.map((lh) => (
                  <option key={lh} value={lh}>
                    {lh}
                  </option>
                ))}
              </select>
            </InspectorFieldRow>

            <InspectorFieldRow label="Tô sáng chữ">
              <div className="flex items-center gap-1.5">
                <InspectorToggleSwitch
                  ariaLabel="Bật màu nền đánh dấu"
                  disabled={!ed}
                  checked={Boolean(currentBgColor)}
                  onChange={(next) =>
                    applyInlineAttr({
                      backgroundColor: next ? HIGHLIGHT_DEFAULT_HEX : null,
                    })
                  }
                />
                {currentBgColor && (
                  <input
                    type="color"
                    aria-label="Màu nền đánh dấu"
                    value={currentBgColor}
                    onChange={(e) =>
                      applyInlineAttr({ backgroundColor: e.target.value }, false)
                    }
                    className={INSPECTOR_COLOR_INPUT_CLS}
                  />
                )}
              </div>
            </InspectorFieldRow>
          </>
        )}
      </InspectorAccordionSection>

      {!compact && !hideEditorialLayout && (
        <TypographyEditorialSection
          ed={ed}
          isDropCapActive={isDropCapActive}
          currentTextColumns={currentTextColumns}
          preventFocusLoss={preventFocusLoss}
        />
      )}

      {!compact && (
        <WikiLinkInspectorSection
          editor={ed}
          isOpen={isLinkPanelOpen}
          onOpenChange={setIsLinkPanelOpen}
        />
      )}

      <TextAnnotationModal
        editor={ed}
        isOpen={annotationModal.open}
        initialTab={annotationModal.tab}
        onClose={() => setAnnotationModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
