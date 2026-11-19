export const MINDMAP_ROUTES = {
  ROOT: 'mindmaps',
  BY_ID: ':id',
} as const;

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
  GOLD = 'GOLD',
  TEAL = 'TEAL',
  INDIGO = 'INDIGO',
  STONE = 'STONE',
}

export const MINDMAP_LIMITS = {
  MAX_TITLE_LENGTH: 150,
  MAX_PERIOD_LENGTH: 80,
  MAX_MINDMAPS_PER_USER: 100,
  MAX_GRAPH_BYTES: 262_144,
} as const;

export const MINDMAP_MESSAGES = {
  NOT_FOUND: 'Không tìm thấy sơ đồ tư duy này.',
  TOO_MANY_MINDMAPS: 'Bạn đã đạt giới hạn số sơ đồ tối đa.',
  GRAPH_TOO_LARGE: 'Kích thước sơ đồ vượt quá giới hạn cho phép.',
} as const;
