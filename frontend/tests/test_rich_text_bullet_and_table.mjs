import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSchema, createNodeFromContent } from '@tiptap/core';
import { EditorState, TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import {
  BlockTypographyExtension,
  BULLET_LIST_STYLE_OPTIONS,
  InlineTypographyMark,
  LIST_NODE_TYPES,
  ListStyleType,
  ORDERED_LIST_STYLE_OPTIONS,
} from '../src/features/lessons/extensions/typography.extension.ts';
import {
  RICH_TABLE_NODE_NAMES,
  RichTableExtensionKit,
  TableActionType,
  executeTableAction,
  insertRichTable,
} from '../src/features/lessons/extensions/table.extension.ts';
import { sanitizeRichHtml } from '../src/utils/common.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  BlockTypographyExtension,
  InlineTypographyMark,
  ...RichTableExtensionKit,
];

test('BlockTypographyExtension đăng ký đầy đủ thuộc tính listStyleType cho bulletList & orderedList', () => {
  assert.equal(BULLET_LIST_STYLE_OPTIONS.length, 3);
  assert.equal(ORDERED_LIST_STYLE_OPTIONS.length, 3);

  const schema = getSchema(extensions);
  const bulletSpec = schema.nodes[LIST_NODE_TYPES.BULLET].spec;
  const orderedSpec = schema.nodes[LIST_NODE_TYPES.ORDERED].spec;

  assert.ok(bulletSpec.attrs?.listStyleType, 'bulletList phải có attr listStyleType');
  assert.ok(orderedSpec.attrs?.listStyleType, 'orderedList phải có attr listStyleType');
});

test('RichTableExtensionKit khởi tạo chuẩn ProseMirror Table Schema với đầy đủ tableRole', () => {
  const schema = getSchema(extensions);

  const tableType = schema.nodes[RICH_TABLE_NODE_NAMES.TABLE];
  const rowType = schema.nodes[RICH_TABLE_NODE_NAMES.ROW];
  const headerType = schema.nodes[RICH_TABLE_NODE_NAMES.HEADER];
  const cellType = schema.nodes[RICH_TABLE_NODE_NAMES.CELL];

  assert.ok(tableType, 'Schema phải có node table');
  assert.ok(rowType, 'Schema phải có node tableRow');
  assert.ok(headerType, 'Schema phải có node tableHeader');
  assert.ok(cellType, 'Schema phải có node tableCell');

  assert.equal(tableType.spec.tableRole, 'table');
  assert.equal(rowType.spec.tableRole, 'row');
  assert.equal(headerType.spec.tableRole, 'header_cell');
  assert.equal(cellType.spec.tableRole, 'cell');
});

test('insertRichTable & executeTableAction hoạt động đúng với Strategy Pattern', () => {
  assert.equal(insertRichTable(null), false);
  assert.equal(executeTableAction(null, TableActionType.ADD_ROW_AFTER), false);

  let insertedPayload = null;
  const mockEditor = {
    chain() {
      return {
        focus() {
          return {
            insertContent(content) {
              insertedPayload = content;
              return {
                run() {
                  return true;
                },
              };
            },
          };
        },
      };
    },
  };

  const ok = insertRichTable(mockEditor, { rows: 3, cols: 3, withHeaderRow: true });
  assert.equal(ok, true);
  assert.equal(insertedPayload.type, RICH_TABLE_NODE_NAMES.TABLE);
  assert.equal(insertedPayload.content.length, 3);
  assert.equal(insertedPayload.content[0].content.length, 3);
  assert.equal(insertedPayload.content[0].content[0].type, RICH_TABLE_NODE_NAMES.HEADER);
  assert.equal(insertedPayload.content[1].content[0].type, RICH_TABLE_NODE_NAMES.CELL);

  // Thực thi trực tiếp các chiến lược TABLE_ACTION_STRATEGIES trên ProseMirror EditorState thật
  const schema = getSchema(extensions);
  const docNode = createNodeFromContent(
    {
      type: 'doc',
      content: [insertedPayload],
    },
    schema
  );
  let state = EditorState.create({ doc: docNode });
  // Đặt con trỏ vào ô đầu tiên của bảng
  state = state.apply(state.tr.setSelection(TextSelection.near(state.doc.resolve(4))));

  const liveEditor = {
    get state() {
      return state;
    },
    commands: {
      focus: () => true,
    },
    view: {
      dispatch: (tr) => {
        state = state.apply(tr);
      },
    },
  };

  assert.equal(executeTableAction(liveEditor, TableActionType.ADD_ROW_AFTER), true);
  assert.equal(state.doc.firstChild.childCount, 4, 'Sau khi thêm hàng phải có 4 hàng');

  assert.equal(executeTableAction(liveEditor, TableActionType.ADD_COL_AFTER), true);
  assert.equal(state.doc.firstChild.firstChild.childCount, 4, 'Sau khi thêm cột phải có 4 cột');

  assert.equal(executeTableAction(liveEditor, TableActionType.DELETE_ROW), true);
  assert.equal(state.doc.firstChild.childCount, 3, 'Sau khi xóa hàng phải còn 3 hàng');

  assert.equal(executeTableAction(liveEditor, TableActionType.DELETE_COL), true);
  assert.equal(state.doc.firstChild.firstChild.childCount, 3, 'Sau khi xóa cột phải còn 3 cột');

  assert.equal(executeTableAction(liveEditor, TableActionType.DELETE_TABLE), true);
  assert.notEqual(state.doc.firstChild?.type.name, RICH_TABLE_NODE_NAMES.TABLE);
});

test('sanitizeRichHtml bảo toàn HTML Danh sách (ul/ol/li + list-style-type) và Bảng biểu (table/tr/th/td)', () => {
  const rawHtml = `
    <ul data-list-style="${ListStyleType.SQUARE}" style="list-style-type: ${ListStyleType.SQUARE}">
      <li><p>Chiến dịch Biên giới 1950</p></li>
    </ul>
    <ol data-list-style="${ListStyleType.UPPER_ROMAN}" style="list-style-type: ${ListStyleType.UPPER_ROMAN}">
      <li><p>Đợt 1: Tấn công Him Lam</p></li>
    </ol>
    <table class="hisgo-rich-table">
      <tbody>
        <tr>
          <th colspan="2"><p>Tương quan lực lượng</p></th>
        </tr>
        <tr>
          <td><p>Ta</p></td>
          <td><p>Pháp</p></td>
        </tr>
      </tbody>
    </table>
  `;

  const sanitized = sanitizeRichHtml(rawHtml);
  assert.match(sanitized, /data-list-style="square"/);
  assert.match(sanitized, /list-style-type: square/);
  assert.match(sanitized, /data-list-style="upper-roman"/);
  assert.match(sanitized, /<table class="hisgo-rich-table">/);
  assert.match(sanitized, /<th colspan="2"><p>Tương quan lực lượng<\/p><\/th>/);
});

test('globals.css và entity-reader.css định nghĩa đầy đủ CSS cho Bullet/Ordered List và Rich Table', () => {
  const globalsCss = fs.readFileSync(
    path.resolve(__dirname, '../src/app/globals.css'),
    'utf8'
  );
  const entityReaderCss = fs.readFileSync(
    path.resolve(__dirname, '../src/components/entity-detail/entity-reader.css'),
    'utf8'
  );

  assert.match(globalsCss, /\.tiptap-content-box ul\s*\{[\s\S]*?list-style-type:\s*disc/);
  assert.match(globalsCss, /\.tiptap-content-box ol\s*\{[\s\S]*?list-style-type:\s*decimal/);
  assert.match(globalsCss, /\.tiptap-content-box table/);
  assert.match(globalsCss, /\.tiptap-content-box \.selectedCell::after/);

  assert.match(entityReaderCss, /\.ue-bio-blocks ul\s*\{[\s\S]*?list-style-type:\s*disc/);
  assert.match(entityReaderCss, /\.ue-bio-blocks ol\s*\{[\s\S]*?list-style-type:\s*decimal/);
  assert.match(entityReaderCss, /\.ue-bio-blocks th > p,\s*\.ue-bio-blocks td > p/);
});
