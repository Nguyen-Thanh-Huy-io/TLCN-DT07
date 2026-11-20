import {
  Node,
  mergeAttributes,
  type Editor,
  type JSONContent,
} from '@tiptap/core';
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  deleteColumn,
  deleteRow,
  deleteTable,
  goToNextCell,
  tableEditing,
  toggleHeaderRow,
} from '@tiptap/pm/tables';

export const RICH_TABLE_NODE_NAMES = {
  TABLE: 'table',
  ROW: 'tableRow',
  HEADER: 'tableHeader',
  CELL: 'tableCell',
} as const;

const PROSEMIRROR_TABLE_ROLES = {
  TABLE: 'table',
  ROW: 'row',
  HEADER_CELL: 'header_cell',
  CELL: 'cell',
} as const;

const NODE_TABLE_ROLE_MAP: Record<string, string> = {
  [RICH_TABLE_NODE_NAMES.TABLE]: PROSEMIRROR_TABLE_ROLES.TABLE,
  [RICH_TABLE_NODE_NAMES.ROW]: PROSEMIRROR_TABLE_ROLES.ROW,
  [RICH_TABLE_NODE_NAMES.HEADER]: PROSEMIRROR_TABLE_ROLES.HEADER_CELL,
  [RICH_TABLE_NODE_NAMES.CELL]: PROSEMIRROR_TABLE_ROLES.CELL,
};

export const TableActionType = {
  ADD_ROW_BEFORE: 'ADD_ROW_BEFORE',
  ADD_ROW_AFTER: 'ADD_ROW_AFTER',
  DELETE_ROW: 'DELETE_ROW',
  ADD_COL_BEFORE: 'ADD_COL_BEFORE',
  ADD_COL_AFTER: 'ADD_COL_AFTER',
  DELETE_COL: 'DELETE_COL',
  TOGGLE_HEADER_ROW: 'TOGGLE_HEADER_ROW',
  DELETE_TABLE: 'DELETE_TABLE',
} as const;

export type TableActionType =
  (typeof TableActionType)[keyof typeof TableActionType];

type ProseMirrorTableCommand = (
  state: Editor['state'],
  dispatch?: (tr: Editor['state']['tr']) => void
) => boolean;

/**
 * Bảng đăng ký Strategy thực thi các thao tác chỉnh sửa bảng biểu (Tuân thủ OCP, không Magic String).
 */
const TABLE_ACTION_STRATEGIES: Record<TableActionType, ProseMirrorTableCommand> = {
  [TableActionType.ADD_ROW_BEFORE]: addRowBefore,
  [TableActionType.ADD_ROW_AFTER]: addRowAfter,
  [TableActionType.DELETE_ROW]: deleteRow,
  [TableActionType.ADD_COL_BEFORE]: addColumnBefore,
  [TableActionType.ADD_COL_AFTER]: addColumnAfter,
  [TableActionType.DELETE_COL]: deleteColumn,
  [TableActionType.TOGGLE_HEADER_ROW]: toggleHeaderRow,
  [TableActionType.DELETE_TABLE]: deleteTable,
};

export function executeTableAction(
  editor: Editor | null,
  action: TableActionType
): boolean {
  if (!editor) return false;
  editor.commands.focus();
  const strategy = TABLE_ACTION_STRATEGIES[action];
  return strategy(editor.state, editor.view.dispatch);
}

export interface InsertRichTableOptions {
  rows?: number;
  cols?: number;
  withHeaderRow?: boolean;
}

export function insertRichTable(
  editor: Editor | null,
  options: InsertRichTableOptions = {}
): boolean {
  if (!editor) return false;
  const rows = Math.max(1, options.rows ?? 3);
  const cols = Math.max(1, options.cols ?? 3);
  const withHeaderRow = options.withHeaderRow ?? true;

  const tableRows: JSONContent[] = Array.from({ length: rows }, (_, rowIndex) => {
    const isHeader = withHeaderRow && rowIndex === 0;
    const cellType = isHeader
      ? RICH_TABLE_NODE_NAMES.HEADER
      : RICH_TABLE_NODE_NAMES.CELL;

    const cells: JSONContent[] = Array.from({ length: cols }, () => ({
      type: cellType,
      content: [{ type: 'paragraph' }],
    }));

    return {
      type: RICH_TABLE_NODE_NAMES.ROW,
      content: cells,
    };
  });

  return editor
    .chain()
    .focus()
    .insertContent({
      type: RICH_TABLE_NODE_NAMES.TABLE,
      content: tableRows,
    })
    .run();
}

function createTableCellAttributes() {
  return {
    colspan: {
      default: 1,
      parseHTML: (element: HTMLElement) =>
        Number(element.getAttribute('colspan') || 1) || 1,
      renderHTML: (attributes: Record<string, unknown>) =>
        Number(attributes.colspan) > 1 ? { colspan: attributes.colspan } : {},
    },
    rowspan: {
      default: 1,
      parseHTML: (element: HTMLElement) =>
        Number(element.getAttribute('rowspan') || 1) || 1,
      renderHTML: (attributes: Record<string, unknown>) =>
        Number(attributes.rowspan) > 1 ? { rowspan: attributes.rowspan } : {},
    },
    colwidth: {
      default: null,
      parseHTML: (element: HTMLElement) => {
        const raw = element.getAttribute('data-colwidth');
        if (!raw) return null;
        const parsed = raw.split(',').map((n) => parseInt(n, 10));
        return parsed.every((n) => !Number.isNaN(n)) ? parsed : null;
      },
      renderHTML: (attributes: Record<string, unknown>) =>
        Array.isArray(attributes.colwidth) && attributes.colwidth.length > 0
          ? { 'data-colwidth': attributes.colwidth.join(',') }
          : {},
    },
  };
}

export const RichTableNode = Node.create({
  name: RICH_TABLE_NODE_NAMES.TABLE,
  group: 'block',
  content: `${RICH_TABLE_NODE_NAMES.ROW}+`,
  isolating: true,

  parseHTML() {
    return [{ tag: 'table' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'table',
      mergeAttributes(HTMLAttributes, { class: 'hisgo-rich-table' }),
      ['tbody', 0],
    ];
  },

  extendNodeSchema(extension) {
    const role = NODE_TABLE_ROLE_MAP[extension.name];
    return role ? { tableRole: role } : {};
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => goToNextCell(1)(this.editor.state, this.editor.view.dispatch),
      'Shift-Tab': () =>
        goToNextCell(-1)(this.editor.state, this.editor.view.dispatch),
    };
  },

  addProseMirrorPlugins() {
    return [tableEditing()];
  },
});

export const RichTableRowNode = Node.create({
  name: RICH_TABLE_NODE_NAMES.ROW,
  content: `(${RICH_TABLE_NODE_NAMES.CELL} | ${RICH_TABLE_NODE_NAMES.HEADER})*`,

  parseHTML() {
    return [{ tag: 'tr' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['tr', mergeAttributes(HTMLAttributes), 0];
  },
});

export const RichTableHeaderNode = Node.create({
  name: RICH_TABLE_NODE_NAMES.HEADER,
  content: 'block+',
  isolating: true,

  addAttributes() {
    return createTableCellAttributes();
  },

  parseHTML() {
    return [{ tag: 'th' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['th', mergeAttributes(HTMLAttributes), 0];
  },
});

export const RichTableCellNode = Node.create({
  name: RICH_TABLE_NODE_NAMES.CELL,
  content: 'block+',
  isolating: true,

  addAttributes() {
    return createTableCellAttributes();
  },

  parseHTML() {
    return [{ tag: 'td' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['td', mergeAttributes(HTMLAttributes), 0];
  },
});

export const RichTableExtensionKit = [
  RichTableNode,
  RichTableRowNode,
  RichTableHeaderNode,
  RichTableCellNode,
];
