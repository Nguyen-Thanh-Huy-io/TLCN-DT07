export enum LessonBlockType {
  TEXT = 'TEXT',
  HEADING = 'HEADING',
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
  CALLOUT = 'CALLOUT',
  QUOTE = 'QUOTE',
  DIVIDER = 'DIVIDER',
  RELATED_PEOPLE = 'RELATED_PEOPLE',
  RELATED_EVENTS = 'RELATED_EVENTS',
  STORY_CHAPTER = 'STORY_CHAPTER',
}

export enum LessonBlockGroup {
  BASIC = 'BASIC',             // Nội dung cơ bản (Rich Text, Heading, Image, Video, Quote, Divider, Callout)
  SPECIALIZED = 'SPECIALIZED', // Tri thức lịch sử (Timeline, Map, Character, Event, Comparison Table, Related People, Related Events)
  ADVANCED = 'ADVANCED',       // Nâng cao (Bố cục nhiều cột SECTION_ROW, v.v.)
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
