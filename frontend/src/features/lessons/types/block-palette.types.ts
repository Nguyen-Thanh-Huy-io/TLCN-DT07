export enum LessonBlockType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  RESOURCE_LINK = 'RESOURCE_LINK',
  TIMELINE = 'TIMELINE',
  MAP = 'MAP',
  CHARACTER = 'CHARACTER',
  EVENT = 'EVENT',
  COMPARISON_TABLE = 'COMPARISON_TABLE',
  QUIZ = 'QUIZ',
  SECTION_ROW = 'SECTION_ROW',
}

export enum LessonBlockGroup {
  BASIC = 'BASIC',             // Nội dung cơ bản (img2.png)
  SPECIALIZED = 'SPECIALIZED', // Khối chuyên biệt (img2.png)
}

export interface BlockPaletteItem {
  type: LessonBlockType;
  label: string;
  description: string;
  group: LessonBlockGroup;
}

export interface LessonBlockPaletteProps {
  onSelectBlock: (blockType: LessonBlockType) => void;
  activeBlockType?: LessonBlockType | null;
  className?: string;
  disabled?: boolean;
}
