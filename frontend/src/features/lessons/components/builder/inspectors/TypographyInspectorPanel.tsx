'use client';

import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ListOrdered,
  List,
  Quote,
  Eraser,
  Code2,
  Link2,
  Image as ImageIcon,
  Minus,
} from 'lucide-react';
import { useActiveEditor } from '../../../context/ActiveEditorContext';
import { WikiLinkInspectorSection } from '../WikiLinkInspectorSection';

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

const BTN_INACTIVE_CLASS =
  'bg-white text-stone-800 border-stone-300 hover:bg-stone-50';
const BTN_ACTIVE_CLASS = 'bg-stone-900 text-white border-stone-900';

const ALIGN_BUTTONS = [
  { id: 'left', label: 'Căn trái', IconComp: AlignLeft },
  { id: 'center', label: 'Căn giữa', IconComp: AlignCenter },
  { id: 'right', label: 'Căn phải', IconComp: AlignRight },
  { id: 'justify', label: 'Căn đều hai bên', IconComp: AlignJustify },
] as const;

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

function TypographyEditorialSection({
  ed,
  nodeType,
  currentLineHeight,
  isDropCapActive,
  currentTextColumns,
  isLinkPanelOpen,
  setIsLinkPanelOpen,
  applyNodeAttr,
  handleInsertImage,
  preventFocusLoss,
}: {
  ed: ReturnType<typeof useActiveEditor>['activeEditor'];
  nodeType: string;
  currentLineHeight: string;
  isDropCapActive: boolean;
  currentTextColumns: 1 | 2 | 3;
  isLinkPanelOpen: boolean;
  setIsLinkPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  applyNodeAttr: (updates: Record<string, unknown>) => void;
  handleInsertImage: () => void;
  preventFocusLoss: (e: React.MouseEvent) => void;
}) {
  return (
    <>
      <div className="space-y-3 pt-3 border-t border-stone-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-800">Giãn dòng</span>
          <select
            value={currentLineHeight}
            onChange={(e) => applyNodeAttr({ lineHeight: e.target.value })}
            className="text-sm font-semibold px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none cursor-pointer text-stone-900"
          >
            {LINE_HEIGHT_OPTIONS.map((lh) => (
              <option key={lh} value={lh}>
                {lh}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center justify-between text-sm font-medium text-stone-800 cursor-pointer">
          <span>Chữ cái đầu đoạn lớn (Drop Cap)</span>
          <input
            type="checkbox"
            checked={isDropCapActive}
            disabled={!ed || nodeType !== NODE_TYPE_PARAGRAPH}
            onChange={(e) => applyNodeAttr({ dropCap: e.target.checked })}
            className="rounded text-stone-900 focus:ring-0 w-4 h-4"
          />
        </label>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-stone-800">
            Chia cột đoạn văn (Tạp chí)
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {TEXT_COLUMN_OPTIONS.map((cols) => (
              <button
                key={cols}
                type="button"
                onMouseDown={preventFocusLoss}
                disabled={!ed || nodeType !== NODE_TYPE_PARAGRAPH}
                onClick={() => applyNodeAttr({ textColumns: cols })}
                className={`py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  currentTextColumns === cols ? BTN_ACTIVE_CLASS : BTN_INACTIVE_CLASS
                }`}
              >
                {cols} cột
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-stone-200 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-stone-700">
          Chèn vào văn bản
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            data-testid="btn-toggle-wiki-link-panel"
            onMouseDown={preventFocusLoss}
            onClick={() => setIsLinkPanelOpen((prev) => !prev)}
            className={`py-2 px-2 border rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isLinkPanelOpen || ed?.isActive('link')
                ? BTN_ACTIVE_CLASS
                : BTN_INACTIVE_CLASS
            }`}
            title="Gắn liên kết văn bản (Ctrl+K)"
          >
            <Link2 className="w-4 h-4" />
            <span>Liên kết</span>
          </button>
          <button
            type="button"
            onMouseDown={preventFocusLoss}
            onClick={handleInsertImage}
            className={`py-2 px-2 border rounded-lg text-sm font-medium text-stone-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${BTN_INACTIVE_CLASS}`}
            title="Chèn hình ảnh"
          >
            <ImageIcon className="w-4 h-4 text-stone-700" />
            <span>Ảnh</span>
          </button>
          <button
            type="button"
            onMouseDown={preventFocusLoss}
            onClick={() => ed?.chain().focus().setHorizontalRule().run()}
            className={`py-2 px-2 border rounded-lg text-sm font-medium text-stone-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${BTN_INACTIVE_CLASS}`}
            title="Chèn đường kẻ ngang"
          >
            <Minus className="w-4 h-4 text-stone-700" />
            <span>Kẻ ngang</span>
          </button>
        </div>
      </div>

      <WikiLinkInspectorSection
        editor={ed}
        isOpen={isLinkPanelOpen}
        onOpenChange={setIsLinkPanelOpen}
      />
    </>
  );
}

/**
 * Bảng điều khiển Định dạng Chữ & Dàn trang Tạp chí (Rich Text Typography Inspector).
 * Tách độc lập theo nguyên tắc Single Responsibility Principle (SRP).
 */
export function TypographyInspectorPanel({
  compact = false,
  accentColor = '#7c4b2e',
}: {
  compact?: boolean;
  accentColor?: string;
}) {
  const { activeEditor: ed } = useActiveEditor();
  const [isLinkPanelOpen, setIsLinkPanelOpen] = useState(false);

  const activeBlockType = getActiveBlockStyle(ed);
  const nodeType = ed?.isActive('heading') ? NODE_TYPE_HEADING : NODE_TYPE_PARAGRAPH;
  const nodeAttrs = ed?.getAttributes(nodeType) || {};
  const markAttrs = ed?.getAttributes('inlineTypography') || {};

  const currentAlign = nodeAttrs.textAlign || 'left';
  const currentLineHeight = nodeAttrs.lineHeight || '160%';
  const isDropCapActive = Boolean(nodeAttrs.dropCap);
  const isLeadParagraphActive = Boolean(nodeAttrs.leadParagraph);
  const currentTextColumns = Number(nodeAttrs.textColumns || 1) as 1 | 2 | 3;
  const currentFont = markAttrs.fontFamily || 'var(--font-be-vietnam-pro), sans-serif';
  const currentSizePx =
    parseInt(String(markAttrs.fontSize || '16').replace('px', ''), 10) || 16;
  const currentColor = markAttrs.color || '#1c1917';
  const currentBgColor = markAttrs.backgroundColor || '';

  const applyInlineAttr = (updates: Record<string, string | null>) => {
    if (!ed) return;
    const merged = { ...markAttrs, ...updates };
    ed.chain().focus().setMark('inlineTypography', merged).run();
  };

  const applyNodeAttr = (updates: Record<string, unknown>) => {
    if (!ed) return;
    ed.chain().focus().updateAttributes(nodeType, updates).run();
  };

  const handleInsertImage = () => {
    if (!ed) return;
    const url = window.prompt('Nhập đường dẫn hình ảnh:');
    if (!url || !url.trim()) return;
    ed.chain()
      .focus()
      .insertContent(
        `<figure class="wiki-media-block"><img src="${url.trim()}" alt="Tư liệu lịch sử" /><figcaption>Chú thích ảnh...</figcaption></figure><p></p>`
      )
      .run();
  };

  const preventFocusLoss = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-stone-700">
          Kiểu chữ & Phông chữ
        </div>

        {!compact && (
          <select
            value={
              activeBlockType === TipTapBlockStyle.PARAGRAPH && isLeadParagraphActive
                ? TipTapBlockStyle.LEAD
                : activeBlockType
            }
            onChange={(e) => applyTipTapBlockStyle(ed, e.target.value)}
            disabled={!ed}
            className="w-full text-sm font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 cursor-pointer text-stone-900"
          >
            <option value={TipTapBlockStyle.PARAGRAPH}>Đoạn văn thường</option>
            <option value={TipTapBlockStyle.LEAD}>Đoạn dẫn nhập (Tạp chí)</option>
            <option value={TipTapBlockStyle.H1}>Tiêu đề chính</option>
            <option value={TipTapBlockStyle.H2}>Tiêu đề mục lớn</option>
            <option value={TipTapBlockStyle.H3}>Tiêu đề tiểu mục</option>
            <option value={TipTapBlockStyle.BLOCKQUOTE}>Khối trích dẫn</option>
            <option value={TipTapBlockStyle.CODE_BLOCK}>Khối tư liệu gốc</option>
          </select>
        )}

        {!compact && (
          <select
            value={currentFont}
            onChange={(e) => applyInlineAttr({ fontFamily: e.target.value })}
            disabled={!ed}
            className="w-full text-sm font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 cursor-pointer text-stone-900"
          >
            <option value="var(--font-be-vietnam-pro), sans-serif">
              Chữ hiện đại (Không chân)
            </option>
            <option value="var(--font-merriweather), serif">
              Chữ cổ điển (Có chân)
            </option>
            <option value="var(--font-noto-serif), serif">
              Chữ biên niên sử (Nét thanh đậm)
            </option>
            <option value="monospace">Chữ hành chính (Đơn cách)</option>
          </select>
        )}

        {/* Hàng 1: [ Đậm | Nghiêng | Gạch chân | Gạch ngang ] + [ Cỡ chữ ] */}
        <div className="flex items-center gap-2">
          <div className="flex items-center flex-1 gap-1">
            {[
              {
                key: 'bold',
                title: 'In đậm',
                Icon: Bold,
                run: () => ed?.chain().focus().toggleBold().run(),
              },
              {
                key: 'italic',
                title: 'In nghiêng',
                Icon: Italic,
                run: () => ed?.chain().focus().toggleItalic().run(),
              },
              ...(compact
                ? []
                : [
                    {
                      key: 'underline',
                      title: 'Gạch chân',
                      Icon: Underline,
                      run: () => ed?.chain().focus().toggleUnderline().run(),
                    },
                    {
                      key: 'strike',
                      title: 'Gạch ngang',
                      Icon: Strikethrough,
                      run: () => ed?.chain().focus().toggleStrike().run(),
                    },
                  ]),
            ].map(({ key, title, Icon, run }) => (
              <button
                key={key}
                type="button"
                onMouseDown={preventFocusLoss}
                onClick={run}
                className={`flex-1 py-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                  ed?.isActive(key)
                    ? 'text-white border-stone-900'
                    : BTN_INACTIVE_CLASS
                }`}
                style={
                  ed?.isActive(key)
                    ? {
                        backgroundColor: accentColor,
                      }
                    : undefined
                }
                title={title}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
              </button>
            ))}
          </div>

          <input
            type="number"
            min={12}
            max={48}
            value={currentSizePx}
            onChange={(e) =>
              applyInlineAttr({ fontSize: `${Number(e.target.value) || 16}px` })
            }
            title="Cỡ chữ"
            className="w-16 text-sm font-bold text-stone-900 bg-white border border-stone-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-stone-900 text-center shrink-0"
          />
        </div>

        {/* Hàng 2: Căn lề */}
        <div className="grid grid-cols-4 gap-1.5">
          {ALIGN_BUTTONS.map(({ id, label, IconComp }) => (
            <button
              key={id}
              type="button"
              onMouseDown={preventFocusLoss}
              onClick={() => applyNodeAttr({ textAlign: id })}
              className={`py-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                currentAlign === id ? BTN_ACTIVE_CLASS : BTN_INACTIVE_CLASS
              }`}
              title={label}
            >
              <IconComp className="w-4 h-4" strokeWidth={2} />
            </button>
          ))}
        </div>

        {/* Hàng 3: Danh sách & Công cụ */}
        <div className="grid grid-cols-5 gap-1.5">
          {[
            {
              key: 'orderedList',
              title: 'Danh sách đánh số',
              Icon: ListOrdered,
              run: () => ed?.chain().focus().toggleOrderedList().run(),
            },
            {
              key: 'bulletList',
              title: 'Danh sách gạch đầu dòng',
              Icon: List,
              run: () => ed?.chain().focus().toggleBulletList().run(),
            },
            {
              key: 'blockquote',
              title: 'Trích dẫn đoạn văn',
              Icon: Quote,
              run: () => ed?.chain().focus().toggleBlockquote().run(),
            },
            {
              key: TOOL_CLEAR,
              title: 'Xóa mọi định dạng',
              Icon: Eraser,
              run: () => ed?.chain().focus().unsetAllMarks().clearNodes().run(),
            },
            {
              key: 'code',
              title: 'Thuật ngữ',
              Icon: Code2,
              run: () => ed?.chain().focus().toggleCode().run(),
            },
          ].map(({ key, title, Icon, run }) => (
            <button
              key={key}
              type="button"
              onMouseDown={preventFocusLoss}
              onClick={run}
              className={`py-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                key !== TOOL_CLEAR && ed?.isActive(key)
                  ? BTN_ACTIVE_CLASS
                  : BTN_INACTIVE_CLASS
              }`}
              title={title}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>

      {/* Màu chữ & Màu nền đánh dấu */}
      <div className="space-y-3 pt-3 border-t border-stone-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-800">Màu chữ</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => applyInlineAttr({ color: e.target.value })}
              className="w-7 h-7 rounded border border-stone-300 p-0.5 cursor-pointer bg-white"
            />
            <span className="text-xs font-mono text-stone-700 uppercase">
              {currentColor}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-stone-800 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(currentBgColor)}
              onChange={(e) =>
                applyInlineAttr({
                  backgroundColor: e.target.checked ? '#fef08a' : null,
                })
              }
              className="rounded text-stone-900 focus:ring-0 w-4 h-4"
            />
            <span>Màu nền đánh dấu</span>
          </label>
          {currentBgColor && (
            <input
              type="color"
              value={currentBgColor}
              onChange={(e) =>
                applyInlineAttr({ backgroundColor: e.target.value })
              }
              className="w-7 h-7 rounded border border-stone-300 p-0.5 cursor-pointer bg-white"
            />
          )}
        </div>
      </div>

      {!compact && (
        <TypographyEditorialSection
          ed={ed}
          nodeType={nodeType}
          currentLineHeight={currentLineHeight}
          isDropCapActive={isDropCapActive}
          currentTextColumns={currentTextColumns}
          isLinkPanelOpen={isLinkPanelOpen}
          setIsLinkPanelOpen={setIsLinkPanelOpen}
          applyNodeAttr={applyNodeAttr}
          handleInsertImage={handleInsertImage}
          preventFocusLoss={preventFocusLoss}
        />
      )}
    </div>
  );
}
