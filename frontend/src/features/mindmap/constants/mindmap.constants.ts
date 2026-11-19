export const MINDMAP_API = {
  ROOT: '/mindmaps',
  BY_ID: (id: string) => `/mindmaps/${id}`,
  GENERATE_PREVIEW: '/mindmaps/generate-preview',
  PUBLIC_ARTICLES: '/public/articles',
} as const;

export enum MindmapTemplateType {
  TREE = 'TREE',
  FLOW = 'FLOW',
  SPIDER = 'SPIDER',
  DOUBLE_BUBBLE = 'DOUBLE_BUBBLE',
  BLANK = 'BLANK',
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
  BEZIER = 'BEZIER',
  STEP = 'STEP',
  STRAIGHT = 'STRAIGHT',
}

export enum MindmapNodeShape {
  CARD = 'CARD',
  PILL = 'PILL',
  CIRCLE = 'CIRCLE',
  PLAIN = 'PLAIN',
}

export enum MindmapNodeSize {
  SM = 'SM',
  MD = 'MD',
  LG = 'LG',
}

export enum MindmapArrangeMode {
  TREE = 'TREE',
  TWO_SIDED = 'TWO_SIDED',
  FISHBONE = 'FISHBONE',
}

export enum MindmapAiEngine {
  GEMINI_FLASH = 'GEMINI_FLASH',
  HEURISTIC = 'HEURISTIC',
}

export const TEMPLATE_OPTIONS: ReadonlyArray<{
  type: MindmapTemplateType;
  label: string;
  description: string;
}> = [
  {
    type: MindmapTemplateType.SPIDER,
    label: 'Mạng nhện (2 phía)',
    description: '1 nhân vật / sự kiện trung tâm toả ra hai bên như XMind',
  },
  {
    type: MindmapTemplateType.TREE,
    label: 'Sơ đồ Cây',
    description: 'Hệ thống hoá triều đại / giai đoạn theo Chính trị, Kinh tế, Quân sự, Văn hoá',
  },
  {
    type: MindmapTemplateType.FLOW,
    label: 'Dòng chảy (Nhân – Quả)',
    description: 'Chuỗi Nguyên nhân → Diễn biến → Kết quả → Ý nghĩa lịch sử',
  },
  {
    type: MindmapTemplateType.DOUBLE_BUBBLE,
    label: 'Bong bóng đôi (So sánh)',
    description: 'Đối chiếu điểm giống ở giữa và điểm khác biệt hai bên',
  },
  {
    type: MindmapTemplateType.BLANK,
    label: 'Tự do',
    description: '1 node trung tâm để tự kéo thả và tuỳ biến theo ý muốn',
  },
];

export const BRANCH_COLOR_STYLES: Record<
  MindmapBranchColor,
  {
    label: string;
    card: string;
    badge: string;
    dot: string;
    stroke: string;
  }
> = {
  [MindmapBranchColor.CRIMSON]: {
    label: 'Đỏ son',
    card: 'border-[#7A1F24] bg-[#7A1F24] text-white shadow-md',
    badge: 'bg-white/20 text-[#F5EEDC]',
    dot: 'bg-[#7A1F24]',
    stroke: '#7A1F24',
  },
  [MindmapBranchColor.NAVY]: {
    label: 'Xanh đậm',
    card: 'border-[#14233F] bg-[#14233F] text-white shadow-md',
    badge: 'bg-white/20 text-sky-100',
    dot: 'bg-[#14233F]',
    stroke: '#14233F',
  },
  [MindmapBranchColor.GOLD]: {
    label: 'Vàng đồng',
    card: 'border-[#C9A45C] bg-[#FFFBF2] text-[#2D1A10] shadow-xs',
    badge: 'bg-[#F5EEDC] text-[#8A621E]',
    dot: 'bg-[#B8893F]',
    stroke: '#B8893F',
  },
  [MindmapBranchColor.ORANGE]: {
    label: 'Cam rực',
    card: 'border-orange-400 bg-orange-50 text-orange-950 shadow-xs',
    badge: 'bg-orange-200/80 text-orange-900',
    dot: 'bg-orange-500',
    stroke: '#f97316',
  },
  [MindmapBranchColor.TEAL]: {
    label: 'Xanh ngọc',
    card: 'border-teal-400 bg-teal-50 text-teal-950 shadow-xs',
    badge: 'bg-teal-100 text-teal-800',
    dot: 'bg-teal-600',
    stroke: '#0d9488',
  },
  [MindmapBranchColor.INDIGO]: {
    label: 'Chàm sử',
    card: 'border-indigo-400 bg-indigo-50 text-indigo-950 shadow-xs',
    badge: 'bg-indigo-100 text-indigo-800',
    dot: 'bg-indigo-600',
    stroke: '#4f46e5',
  },
  [MindmapBranchColor.PURPLE]: {
    label: 'Tím nho',
    card: 'border-purple-400 bg-purple-50 text-purple-950 shadow-xs',
    badge: 'bg-purple-100 text-purple-800',
    dot: 'bg-purple-600',
    stroke: '#9333ea',
  },
  [MindmapBranchColor.STONE]: {
    label: 'Giấy cổ',
    card: 'border-[#D6C7A9] bg-white text-[#2D1A10] shadow-xs',
    badge: 'bg-stone-100 text-stone-700',
    dot: 'bg-stone-500',
    stroke: '#78716c',
  },
};

export const CANVAS_THEME_CONFIG: Record<
  MindmapCanvasTheme,
  { label: string; bgClass: string; gridColor: string; hintClass: string }
> = {
  [MindmapCanvasTheme.PAPER]: {
    label: 'Giấy dó',
    bgClass: 'bg-[#FAF6EA]',
    gridColor: '#D5C5A3',
    hintClass: 'bg-white/85 text-stone-600 border-[#E2D5B8]',
  },
  [MindmapCanvasTheme.WHITE]: {
    label: 'Trắng',
    bgClass: 'bg-white',
    gridColor: '#E2E8F0',
    hintClass: 'bg-slate-50/90 text-slate-600 border-slate-200',
  },
  [MindmapCanvasTheme.DARK]: {
    label: 'Bảng tối',
    bgClass: 'bg-[#22252A]',
    gridColor: '#3B4048',
    hintClass: 'bg-zinc-900/85 text-zinc-300 border-zinc-700',
  },
};

export const NODE_SIZE_WIDTH: Record<MindmapNodeSize, number> = {
  [MindmapNodeSize.SM]: 176,
  [MindmapNodeSize.MD]: 228,
  [MindmapNodeSize.LG]: 296,
};

export const NODE_SHAPE_CLASS: Record<MindmapNodeShape, string> = {
  [MindmapNodeShape.CARD]: 'rounded-xl border-2',
  [MindmapNodeShape.PILL]: 'rounded-full border-2 px-5',
  [MindmapNodeShape.CIRCLE]: 'rounded-full border-2 aspect-square flex flex-col justify-center text-center',
  [MindmapNodeShape.PLAIN]: 'rounded-lg border border-transparent !bg-transparent !shadow-none',
};

export const MINDMAP_CANVAS = {
  NODE_WIDTH: 228,
  NODE_HEIGHT: 84,
  MIN_ZOOM: 0.45,
  MAX_ZOOM: 1.6,
  ZOOM_STEP: 0.15,
  AUTOSAVE_DELAY_MS: 900,
} as const;
