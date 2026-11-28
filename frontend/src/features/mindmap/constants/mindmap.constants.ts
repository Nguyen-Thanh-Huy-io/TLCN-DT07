import { SavedMaterialKind, type SavableMaterialKind } from '@/features/saved-materials/constants/saved-material.constants';

export const MINDMAP_API = {
  ROOT: '/mindmaps',
  GENERATE_PREVIEW: '/mindmaps/generate-preview',
  BY_ID: (id: string) => `/mindmaps/${id}`,
  PUBLIC_ARTICLES: '/public/articles',
  PUBLIC_ARTICLE_BY_SLUG: (slug: string) => `/public/articles/${encodeURIComponent(slug)}`,
  PUBLIC_TIMELINES: '/public/timelines',
} as const;

export enum MindmapAiEngine {
  GEMINI_FLASH = 'GEMINI_FLASH',
  HEURISTIC = 'HEURISTIC',
}

export const AI_MINDMAP_PROMPT_EXAMPLES: ReadonlyArray<{
  label: string;
  prompt: string;
}> = [
  {
    label: 'Triều Trần & 3 lần chống Nguyên - Mông',
    prompt:
      'Xây dựng sơ đồ tư duy về Vương triều Nhà Trần (1225–1400): Bối cảnh thành lập, hào khí Đông A, diễn biến 3 lần kháng chiến chống quân Nguyên – Mông (1258, 1285, 1287–1288), các danh tướng tiêu biểu và ý nghĩa lịch sử.',
  },
  {
    label: 'Khởi nghĩa Lam Sơn (1418–1427)',
    prompt:
      'Phân tích cuộc Khởi nghĩa Lam Sơn (1418–1427) do Lê Lợi và Nguyễn Trãi lãnh đạo: Bối cảnh ách đô hộ nhà Minh, 3 giai đoạn phát triển, chiến thắng Tốt Động – Chúc Động, Chi Lăng – Xương Giang và Bình Ngô đại cáo.',
  },
  {
    label: 'Phong trào Tây Sơn & Quang Trung',
    prompt:
      'Sơ đồ tư duy về Phong trào Tây Sơn và Hoàng đế Quang Trung – Nguyễn Huệ: Từ khởi nghĩa nông dân đến lật đổ chính quyền Lê – Trịnh – Nguyễn, đại thắng Rạch Gầm – Xoài Mút (1785) và Ngọc Hồi – Đống Đa (1789).',
  },
  {
    label: 'Chiến dịch Điện Biên Phủ 1954',
    prompt:
      'Hệ thống hóa Chiến dịch Điện Biên Phủ năm 1954: Âm mưu kế hoạch Nava, phương châm "Đánh chắc, tiến chắc" của Đại tướng Võ Nguyên Giáp, 3 đợt tiến công, kết quả và tác động tới Hiệp định Giơ-ne-vơ.',
  },
];

export enum ReaderSourceKind {
  ARTICLE = 'ARTICLE',
  LESSON = 'LESSON',
  SAVED = 'SAVED',
}

export type ReadableMaterialKind = ReaderSourceKind.ARTICLE | ReaderSourceKind.LESSON;

/** Chuyển kind đọc tại-chỗ (tab UI) sang kind lưu trữ dùng chung với tư liệu đã lưu. */
export function toSavedMaterialKind(kind: ReadableMaterialKind): SavableMaterialKind {
  return kind === ReaderSourceKind.ARTICLE ? SavedMaterialKind.ARTICLE : SavedMaterialKind.LESSON;
}

export enum MindmapTemplateType {
  TREE = 'TREE',
  FLOW = 'FLOW',
  SPIDER = 'SPIDER',
  DOUBLE_BUBBLE = 'DOUBLE_BUBBLE',
  BLANK = 'BLANK',
}

export enum MindmapStructure {
  MIND_MAP = 'MIND_MAP',
  ORG_CHART = 'ORG_CHART',
  LOGIC_CHART = 'LOGIC_CHART',
  FISHBONE = 'FISHBONE',
  FREEFORM = 'FREEFORM',
  TIMELINE = 'TIMELINE',
}

export enum MindmapMapTheme {
  MODERN_BLUE = 'MODERN_BLUE',
  HISGO_HERITAGE = 'HISGO_HERITAGE',
  RAINBOW_PASTEL = 'RAINBOW_PASTEL',
  DARK_CHALK = 'DARK_CHALK',
  MINIMAL_INK = 'MINIMAL_INK',
  WARM_AMBER = 'WARM_AMBER',
}

export enum MindmapBranchColor {
  CRIMSON = 'CRIMSON',
  NAVY = 'NAVY',
  GOLD = 'GOLD',
  ORANGE = 'ORANGE',
  TEAL = 'TEAL',
  INDIGO = 'INDIGO',
  PURPLE = 'PURPLE',
  STONE = 'STONE',
}

export enum MindmapCanvasTheme {
  PAPER = 'PAPER',
  WHITE = 'WHITE',
  DARK = 'DARK',
}

export enum MindmapEdgeStyle {
  AUTO = 'AUTO',
  BEZIER = 'BEZIER',
  STEP = 'STEP',
  STRAIGHT = 'STRAIGHT',
}

export enum MindmapNodeShape {
  AUTO = 'AUTO',
  CARD = 'CARD',
  PILL = 'PILL',
  UNDERLINE = 'UNDERLINE',
  CIRCLE = 'CIRCLE',
  PLAIN = 'PLAIN',
}

export enum MindmapNodeSize {
  SM = 'SM',
  MD = 'MD',
  LG = 'LG',
}

export enum MindmapBorderStyle {
  NONE = 'NONE',
  SOLID = 'SOLID',
  DASHED = 'DASHED',
  DOTTED = 'DOTTED',
}

export const NODE_RADIUS_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: '0px (Vuông)' },
  { value: 4, label: '4px (Gọn)' },
  { value: 10, label: '10px (Bo mềm)' },
  { value: 20, label: '20px (Tròn)' },
];

export const STROKE_WIDTH_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1.5, label: 'Mảnh (1.5px)' },
  { value: 2.2, label: 'Vừa (2.2px)' },
  { value: 3.5, label: 'Đậm (3.5px)' },
];

export enum MindmapImageHeight {
  SM = 'SM',
  MD = 'MD',
  LG = 'LG',
}

export enum MindmapBranchSide {
  AUTO = 'AUTO',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum MindmapInspectorTab {
  NODE = 'NODE',
  MARKERS = 'MARKERS',
  STYLE = 'STYLE',
  OUTLINE = 'OUTLINE',
  NOTES = 'NOTES',
}

export enum MindmapToolMode {
  POINTER = 'POINTER',
  HAND = 'HAND',
}

export enum MindmapMarkerId {
  FLAG_ORANGE = 'FLAG_ORANGE',
  FLAG_RED = 'FLAG_RED',
  PRIORITY_1 = 'PRIORITY_1',
  PRIORITY_2 = 'PRIORITY_2',
  PRIORITY_3 = 'PRIORITY_3',
  STAR_GOLD = 'STAR_GOLD',
  TROPHY = 'TROPHY',
  CROWN = 'CROWN',
  PIN = 'PIN',
  CHECK = 'CHECK',
}

export enum MindmapShortcutKey {
  TAB = 'Tab',
  ENTER = 'Enter',
  DELETE = 'Delete',
  BACKSPACE = 'Backspace',
  ESCAPE = 'Escape',
  SPACE = ' ',
  UNDO = 'z',
  REDO = 'y',
}

export const TEMPLATE_OPTIONS: ReadonlyArray<{
  type: MindmapTemplateType;
  label: string;
  description: string;
}> = [
  {
    type: MindmapTemplateType.BLANK,
    label: 'Trống (1 chủ đề)',
    description: 'Bắt đầu với 1 chủ đề trung tâm gọn sạch, tự phát triển nhánh bằng Tab / nút +',
  },
  {
    type: MindmapTemplateType.SPIDER,
    label: 'Gợi ý 4 góc nhìn',
    description: 'Dựng sẵn 4 nhánh Bối cảnh, Chủ trương, Sự kiện, Di sản',
  },
  {
    type: MindmapTemplateType.TREE,
    label: 'Gợi ý Triều đại',
    description: 'Dựng sẵn 4 mảng Chính trị, Kinh tế, Quân sự, Văn hoá',
  },
  {
    type: MindmapTemplateType.FLOW,
    label: 'Gợi ý Nhân – Quả',
    description: 'Chuỗi Nguyên nhân → Diễn biến → Kết quả → Ý nghĩa lịch sử',
  },
  {
    type: MindmapTemplateType.DOUBLE_BUBBLE,
    label: 'Gợi ý So sánh',
    description: 'Đặt điểm chung và điểm riêng hai bên để đối chiếu sự kiện',
  },
];

export const STRUCTURE_OPTIONS: ReadonlyArray<{
  id: MindmapStructure;
  label: string;
  hint: string;
}> = [
  {
    id: MindmapStructure.MIND_MAP,
    label: 'Sơ đồ tư duy',
    hint: 'Trung tâm ở giữa, tỏa đều hai bên',
  },
  {
    id: MindmapStructure.ORG_CHART,
    label: 'Sơ đồ tổ chức',
    hint: 'Phân cấp từ trên xuống, dây vuông góc',
  },
  {
    id: MindmapStructure.LOGIC_CHART,
    label: 'Cây logic ngang',
    hint: 'Tỏa toàn bộ nhánh từ trái sang phải',
  },
  {
    id: MindmapStructure.FISHBONE,
    label: 'Sơ đồ xương cá',
    hint: 'Xương sống ngang phân tích nguyên nhân',
  },
  {
    id: MindmapStructure.TIMELINE,
    label: 'Dòng thời gian (Timeline)',
    hint: 'Trục niên biểu ngang, phân nhánh so le theo mốc năm',
  },
  {
    id: MindmapStructure.FREEFORM,
    label: 'Tự do (Kéo thả)',
    hint: 'Đặt node ở bất kỳ vị trí nào trên bảng',
  },
];

export interface BranchPaletteToken {
  nodeBg: string;
  nodeText: string;
  nodeBorder: string;
  stroke: string;
  leafText: string;
  chipBg: string;
  chipText: string;
}

export interface MapThemeConfig {
  id: MindmapMapTheme;
  label: string;
  isDark: boolean;
  canvasBg: string;
  gridDotColor: string;
  rootBg: string;
  rootText: string;
  rootBorder: string;
  branchPalette: readonly BranchPaletteToken[];
  previewColors: readonly [string, string, string];
}

export const MAP_THEME_CONFIGS: Record<MindmapMapTheme, MapThemeConfig> = {
  [MindmapMapTheme.MODERN_BLUE]: {
    id: MindmapMapTheme.MODERN_BLUE,
    label: 'Xanh hiện đại',
    isDark: false,
    canvasBg: '#FFFFFF',
    gridDotColor: '#CBD5E1',
    rootBg: '#16357B',
    rootText: '#FFFFFF',
    rootBorder: '#16357B',
    branchPalette: [
      {
        nodeBg: '#DCE8FD',
        nodeText: '#14264B',
        nodeBorder: '#BBD3FC',
        stroke: '#3B82F6',
        leafText: '#1E293B',
        chipBg: '#F1F5F9',
        chipText: '#475569',
      },
      {
        nodeBg: '#E0F2FE',
        nodeText: '#0C4A6E',
        nodeBorder: '#BAE6FD',
        stroke: '#2563EB',
        leafText: '#1E293B',
        chipBg: '#F1F5F9',
        chipText: '#475569',
      },
    ],
    previewColors: ['#16357B', '#3B82F6', '#DCE8FD'],
  },
  [MindmapMapTheme.HISGO_HERITAGE]: {
    id: MindmapMapTheme.HISGO_HERITAGE,
    label: 'Di sản HISGO',
    isDark: false,
    canvasBg: '#FAF6EA',
    gridDotColor: '#D5C5A3',
    rootBg: '#7A1F24',
    rootText: '#FFF8EC',
    rootBorder: '#5E1519',
    branchPalette: [
      {
        nodeBg: '#FFF4DC',
        nodeText: '#5C3D0E',
        nodeBorder: '#D4AE67',
        stroke: '#B8893F',
        leafText: '#2D1A10',
        chipBg: '#F5EEDC',
        chipText: '#7A541C',
      },
      {
        nodeBg: '#E6F5F2',
        nodeText: '#11423B',
        nodeBorder: '#7AC4B8',
        stroke: '#0D9488',
        leafText: '#2D1A10',
        chipBg: '#F1FAF8',
        chipText: '#115E59',
      },
      {
        nodeBg: '#EAEFFD',
        nodeText: '#1E295E',
        nodeBorder: '#9FB3F5',
        stroke: '#4F46E5',
        leafText: '#2D1A10',
        chipBg: '#F3F6FE',
        chipText: '#3730A3',
      },
      {
        nodeBg: '#F9ECEC',
        nodeText: '#5E1A1E',
        nodeBorder: '#E2A6A9',
        stroke: '#9E2A30',
        leafText: '#2D1A10',
        chipBg: '#FDF4F4',
        chipText: '#7A1F24',
      },
    ],
    previewColors: ['#7A1F24', '#B8893F', '#FFF4DC'],
  },
  [MindmapMapTheme.RAINBOW_PASTEL]: {
    id: MindmapMapTheme.RAINBOW_PASTEL,
    label: 'Đa sắc học tập',
    isDark: false,
    canvasBg: '#FFFFFF',
    gridDotColor: '#E2E8F0',
    rootBg: '#192252',
    rootText: '#FFFFFF',
    rootBorder: '#192252',
    branchPalette: [
      {
        nodeBg: '#FCD5CE',
        nodeText: '#6B1D1A',
        nodeBorder: '#F7ABA0',
        stroke: '#E88A80',
        leafText: '#27272A',
        chipBg: '#FFF1EF',
        chipText: '#9F2F2A',
      },
      {
        nodeBg: '#FF8533',
        nodeText: '#FFFFFF',
        nodeBorder: '#EA6B17',
        stroke: '#F97316',
        leafText: '#27272A',
        chipBg: '#FFF3E8',
        chipText: '#9A3412',
      },
      {
        nodeBg: '#93B5FF',
        nodeText: '#132554',
        nodeBorder: '#6C98F8',
        stroke: '#5B8DEF',
        leafText: '#27272A',
        chipBg: '#EFF4FF',
        chipText: '#1E3A8A',
      },
      {
        nodeBg: '#B7E4C7',
        nodeText: '#134227',
        nodeBorder: '#82CE9F',
        stroke: '#34A853',
        leafText: '#27272A',
        chipBg: '#ECFDF5',
        chipText: '#166534',
      },
      {
        nodeBg: '#E9D5FF',
        nodeText: '#4C1D95',
        nodeBorder: '#C084FC',
        stroke: '#9333EA',
        leafText: '#27272A',
        chipBg: '#FAF5FF',
        chipText: '#6B21A8',
      },
    ],
    previewColors: ['#192252', '#F97316', '#93B5FF'],
  },
  [MindmapMapTheme.DARK_CHALK]: {
    id: MindmapMapTheme.DARK_CHALK,
    label: 'Bảng tối hiện đại',
    isDark: true,
    canvasBg: '#1F2128',
    gridDotColor: '#363A45',
    rootBg: '#272A33',
    rootText: '#F8FAFC',
    rootBorder: '#94A3B8',
    branchPalette: [
      {
        nodeBg: '#FEF08A',
        nodeText: '#1F2128',
        nodeBorder: '#FDE047',
        stroke: '#FACC15',
        leafText: '#E2E8F0',
        chipBg: '#323540',
        chipText: '#CBD5E1',
      },
      {
        nodeBg: '#D8B4FE',
        nodeText: '#1F2128',
        nodeBorder: '#C084FC',
        stroke: '#C084FC',
        leafText: '#E2E8F0',
        chipBg: '#323540',
        chipText: '#CBD5E1',
      },
      {
        nodeBg: '#93C5FD',
        nodeText: '#0F172A',
        nodeBorder: '#60A5FA',
        stroke: '#60A5FA',
        leafText: '#E2E8F0',
        chipBg: '#323540',
        chipText: '#CBD5E1',
      },
      {
        nodeBg: '#BBF7D0',
        nodeText: '#0F172A',
        nodeBorder: '#4ADE80',
        stroke: '#4ADE80',
        leafText: '#E2E8F0',
        chipBg: '#323540',
        chipText: '#CBD5E1',
      },
    ],
    previewColors: ['#1F2128', '#D8B4FE', '#FEF08A'],
  },
  [MindmapMapTheme.MINIMAL_INK]: {
    id: MindmapMapTheme.MINIMAL_INK,
    label: 'Tối giản sắc nét',
    isDark: false,
    canvasBg: '#F8FAFC',
    gridDotColor: '#CBD5E1',
    rootBg: '#0F172A',
    rootText: '#FFFFFF',
    rootBorder: '#0F172A',
    branchPalette: [
      {
        nodeBg: '#FFFFFF',
        nodeText: '#0F172A',
        nodeBorder: '#CBD5E1',
        stroke: '#64748B',
        leafText: '#1E293B',
        chipBg: '#F1F5F9',
        chipText: '#475569',
      },
    ],
    previewColors: ['#0F172A', '#64748B', '#FFFFFF'],
  },
  [MindmapMapTheme.WARM_AMBER]: {
    id: MindmapMapTheme.WARM_AMBER,
    label: 'Hổ phách ấm',
    isDark: false,
    canvasBg: '#FFFBF2',
    gridDotColor: '#E5D3B3',
    rootBg: '#7C2D12',
    rootText: '#FFF7ED',
    rootBorder: '#5A1E0A',
    branchPalette: [
      {
        nodeBg: '#FFEDD5',
        nodeText: '#7C2D12',
        nodeBorder: '#FDBA74',
        stroke: '#EA580C',
        leafText: '#431407',
        chipBg: '#FFF7ED',
        chipText: '#9A3412',
      },
      {
        nodeBg: '#FEF3C7',
        nodeText: '#78350F',
        nodeBorder: '#FCD34D',
        stroke: '#D97706',
        leafText: '#431407',
        chipBg: '#FFFBEB',
        chipText: '#92400E',
      },
    ],
    previewColors: ['#7C2D12', '#EA580C', '#FFEDD5'],
  },
};

export const BRANCH_COLOR_STYLES: Record<
  MindmapBranchColor,
  {
    label: string;
    token: BranchPaletteToken;
    dot: string;
  }
> = {
  [MindmapBranchColor.CRIMSON]: {
    label: 'Đỏ son',
    dot: 'bg-[#7A1F24]',
    token: {
      nodeBg: '#7A1F24',
      nodeText: '#FFFFFF',
      nodeBorder: '#5E1519',
      stroke: '#7A1F24',
      leafText: '#5E1519',
      chipBg: '#F9ECEC',
      chipText: '#7A1F24',
    },
  },
  [MindmapBranchColor.NAVY]: {
    label: 'Xanh đậm',
    dot: 'bg-[#16357B]',
    token: {
      nodeBg: '#16357B',
      nodeText: '#FFFFFF',
      nodeBorder: '#112961',
      stroke: '#2563EB',
      leafText: '#16357B',
      chipBg: '#EFF6FF',
      chipText: '#1D4ED8',
    },
  },
  [MindmapBranchColor.GOLD]: {
    label: 'Vàng đồng',
    dot: 'bg-[#B8893F]',
    token: {
      nodeBg: '#FFF4DC',
      nodeText: '#5C3D0E',
      nodeBorder: '#D4AE67',
      stroke: '#B8893F',
      leafText: '#4A310B',
      chipBg: '#FAF0D7',
      chipText: '#7A541C',
    },
  },
  [MindmapBranchColor.ORANGE]: {
    label: 'Cam rực',
    dot: 'bg-orange-500',
    token: {
      nodeBg: '#FFEDD5',
      nodeText: '#7C2D12',
      nodeBorder: '#FB923C',
      stroke: '#F97316',
      leafText: '#7C2D12',
      chipBg: '#FFF7ED',
      chipText: '#C2410C',
    },
  },
  [MindmapBranchColor.TEAL]: {
    label: 'Xanh ngọc',
    dot: 'bg-teal-600',
    token: {
      nodeBg: '#CCFBF1',
      nodeText: '#134E4A',
      nodeBorder: '#5EEAD4',
      stroke: '#0D9488',
      leafText: '#115E59',
      chipBg: '#F0FDFA',
      chipText: '#0F766E',
    },
  },
  [MindmapBranchColor.INDIGO]: {
    label: 'Chàm sử',
    dot: 'bg-indigo-600',
    token: {
      nodeBg: '#E0E7FF',
      nodeText: '#1E1B4B',
      nodeBorder: '#A5B4FC',
      stroke: '#4F46E5',
      leafText: '#312E81',
      chipBg: '#EEF2FF',
      chipText: '#4338CA',
    },
  },
  [MindmapBranchColor.PURPLE]: {
    label: 'Tím nho',
    dot: 'bg-purple-600',
    token: {
      nodeBg: '#F3E8FF',
      nodeText: '#4C1D95',
      nodeBorder: '#D8B4FE',
      stroke: '#9333EA',
      leafText: '#581C87',
      chipBg: '#FAF5FF',
      chipText: '#7E22CE',
    },
  },
  [MindmapBranchColor.STONE]: {
    label: 'Trắng ngà',
    dot: 'bg-stone-500',
    token: {
      nodeBg: '#F8FAFC',
      nodeText: '#1E293B',
      nodeBorder: '#CBD5E1',
      stroke: '#64748B',
      leafText: '#334155',
      chipBg: '#F1F5F9',
      chipText: '#475569',
    },
  },
};

export interface MarkerMeta {
  id: MindmapMarkerId;
  label: string;
  glyph: string;
  bg: string;
  fg: string;
}

export const MINDMAP_MARKERS: Record<MindmapMarkerId, MarkerMeta> = {
  [MindmapMarkerId.FLAG_ORANGE]: {
    id: MindmapMarkerId.FLAG_ORANGE,
    label: 'Cờ trọng tâm',
    glyph: '⚑',
    bg: '#F59E0B',
    fg: '#FFFFFF',
  },
  [MindmapMarkerId.FLAG_RED]: {
    id: MindmapMarkerId.FLAG_RED,
    label: 'Cờ chiến công',
    glyph: '⚑',
    bg: '#EF4444',
    fg: '#FFFFFF',
  },
  [MindmapMarkerId.PRIORITY_1]: {
    id: MindmapMarkerId.PRIORITY_1,
    label: 'Ưu tiên 1',
    glyph: '1',
    bg: '#EF4444',
    fg: '#FFFFFF',
  },
  [MindmapMarkerId.PRIORITY_2]: {
    id: MindmapMarkerId.PRIORITY_2,
    label: 'Ưu tiên 2',
    glyph: '2',
    bg: '#F97316',
    fg: '#FFFFFF',
  },
  [MindmapMarkerId.PRIORITY_3]: {
    id: MindmapMarkerId.PRIORITY_3,
    label: 'Ưu tiên 3',
    glyph: '3',
    bg: '#EAB308',
    fg: '#FFFFFF',
  },
  [MindmapMarkerId.STAR_GOLD]: {
    id: MindmapMarkerId.STAR_GOLD,
    label: 'Điểm sáng',
    glyph: '★',
    bg: '#F59E0B',
    fg: '#FFFFFF',
  },
  [MindmapMarkerId.TROPHY]: {
    id: MindmapMarkerId.TROPHY,
    label: 'Thắng lợi',
    glyph: '🏆',
    bg: '#FEF3C7',
    fg: '#92400E',
  },
  [MindmapMarkerId.CROWN]: {
    id: MindmapMarkerId.CROWN,
    label: 'Triều đại',
    glyph: '👑',
    bg: '#EDE9FE',
    fg: '#5B21B6',
  },
  [MindmapMarkerId.PIN]: {
    id: MindmapMarkerId.PIN,
    label: 'Địa danh',
    glyph: '📍',
    bg: '#E0F2FE',
    fg: '#0369A1',
  },
  [MindmapMarkerId.CHECK]: {
    id: MindmapMarkerId.CHECK,
    label: 'Đã nắm vững',
    glyph: '✓',
    bg: '#10B981',
    fg: '#FFFFFF',
  },
};

export const NODE_SIZE_MAX_WIDTH: Record<MindmapNodeSize, number> = {
  [MindmapNodeSize.SM]: 176,
  [MindmapNodeSize.MD]: 232,
  [MindmapNodeSize.LG]: 304,
};

export const IMAGE_HEIGHT_PX: Record<MindmapImageHeight, number> = {
  [MindmapImageHeight.SM]: 84,
  [MindmapImageHeight.MD]: 124,
  [MindmapImageHeight.LG]: 172,
};

export const MINDMAP_CANVAS = {
  DEFAULT_NODE_WIDTH: 148,
  DEFAULT_NODE_HEIGHT: 42,
  MIN_ZOOM: 0.18,
  MAX_ZOOM: 1.85,
  ZOOM_STEP: 0.12,
  AUTOSAVE_DELAY_MS: 850,
  MAX_HISTORY: 40,
} as const;

/**
 * Mức thu gọn nhanh khi biên tập sơ đồ (Edit Mode)
 */
export enum MindmapCollapsePreset {
  ROOT_ONLY = 'ROOT_ONLY',
  LEVEL_1 = 'LEVEL_1',
  EXPAND_ALL = 'EXPAND_ALL',
}

/**
 * 3 Chiến lược Ôn tập Chủ động (Active Recall Mode)
 */
export enum MindmapRecallMode {
  PROGRESSIVE_UNFOLD = 'PROGRESSIVE_UNFOLD',
  BLUR_CLOZE = 'BLUR_CLOZE',
  DATE_DETAIL_ONLY = 'DATE_DETAIL_ONLY',
}

/**
 * Mức tự đánh giá trí nhớ trên từng nhánh khi ôn tập
 */
export enum MindmapRecallRating {
  REMEMBERED = 'REMEMBERED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
}

export interface MindmapRecallStrategyOption {
  mode: MindmapRecallMode;
  stepNumber: string;
  title: string;
  summary: string;
  isRecommended?: boolean;
}

export const MINDMAP_RECALL_STRATEGY_OPTIONS: ReadonlyArray<MindmapRecallStrategyOption> = [
  {
    mode: MindmapRecallMode.PROGRESSIVE_UNFOLD,
    stepNumber: '01',
    title: 'Thu gọn mở dần',
    summary: 'Thu gọn từng nhánh, mở dần theo tiến trình ôn tập.',
    isRecommended: true,
  },
  {
    mode: MindmapRecallMode.BLUR_CLOZE,
    stepNumber: '02',
    title: 'Che mờ thông tin',
    summary: 'Giữ khung cây nhưng che mờ chữ để tự nhớ và kiểm tra.',
  },
  {
    mode: MindmapRecallMode.DATE_DETAIL_ONLY,
    stepNumber: '03',
    title: 'Ôn tập theo mốc',
    summary: 'Chỉ che Mốc niên đại và Ghi chú để luyện nhớ lịch sử.',
  },
];
