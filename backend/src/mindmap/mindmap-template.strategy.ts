import { Injectable } from '@nestjs/common';
import { MindmapBranchColor, MindmapTemplateType } from './mindmap.constant';

export interface MindmapArticleRef {
  id: string;
  slug: string;
  title: string;
}

export interface MindmapNodeData {
  id: string;
  x: number;
  y: number;
  title: string;
  badge?: string;
  note?: string;
  color: MindmapBranchColor;
  articleRef?: MindmapArticleRef;
}

export interface MindmapEdgeData {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

export interface MindmapGraphData {
  nodes: MindmapNodeData[];
  edges: MindmapEdgeData[];
}

export type MindmapTemplateBuilder = (
  title: string,
  periodLabel?: string,
) => MindmapGraphData;

const TEMPLATE_BUILDERS: Record<MindmapTemplateType, MindmapTemplateBuilder> = {
  [MindmapTemplateType.TREE]: (title, periodLabel) => ({
    nodes: [
      {
        id: 'n-root',
        x: 80,
        y: 260,
        title,
        badge: periodLabel || 'Chủ đề trung tâm',
        color: MindmapBranchColor.CRIMSON,
      },
      {
        id: 'n-pol',
        x: 420,
        y: 60,
        title: 'Chính trị & Triều chính',
        badge: 'Nhánh 1',
        color: MindmapBranchColor.GOLD,
      },
      {
        id: 'n-eco',
        x: 420,
        y: 195,
        title: 'Kinh tế & Xã hội',
        badge: 'Nhánh 2',
        color: MindmapBranchColor.TEAL,
      },
      {
        id: 'n-mil',
        x: 420,
        y: 330,
        title: 'Quân sự & Kháng chiến',
        badge: 'Nhánh 3',
        color: MindmapBranchColor.INDIGO,
      },
      {
        id: 'n-cul',
        x: 420,
        y: 465,
        title: 'Văn hoá & Thành tựu',
        badge: 'Nhánh 4',
        color: MindmapBranchColor.STONE,
      },
    ],
    edges: [
      { id: 'e-1', fromId: 'n-root', toId: 'n-pol' },
      { id: 'e-2', fromId: 'n-root', toId: 'n-eco' },
      { id: 'e-3', fromId: 'n-root', toId: 'n-mil' },
      { id: 'e-4', fromId: 'n-root', toId: 'n-cul' },
    ],
  }),

  [MindmapTemplateType.FLOW]: (title, periodLabel) => ({
    nodes: [
      {
        id: 'n-cause',
        x: 60,
        y: 220,
        title: 'Bối cảnh & Nguyên nhân',
        badge: periodLabel || 'Bước 1',
        color: MindmapBranchColor.STONE,
      },
      {
        id: 'n-main',
        x: 340,
        y: 220,
        title,
        badge: 'Diễn biến chính',
        color: MindmapBranchColor.CRIMSON,
      },
      {
        id: 'n-result',
        x: 620,
        y: 220,
        title: 'Kết quả trực tiếp',
        badge: 'Bước 3',
        color: MindmapBranchColor.GOLD,
      },
      {
        id: 'n-impact',
        x: 900,
        y: 220,
        title: 'Ý nghĩa lịch sử',
        badge: 'Hệ quả',
        color: MindmapBranchColor.TEAL,
      },
    ],
    edges: [
      { id: 'e-1', fromId: 'n-cause', toId: 'n-main', label: 'dẫn tới' },
      { id: 'e-2', fromId: 'n-main', toId: 'n-result', label: 'tạo ra' },
      { id: 'e-3', fromId: 'n-result', toId: 'n-impact', label: 'để lại' },
    ],
  }),

  [MindmapTemplateType.SPIDER]: (title, periodLabel) => ({
    nodes: [
      {
        id: 'n-center',
        x: 420,
        y: 240,
        title,
        badge: periodLabel || 'Trung tâm',
        color: MindmapBranchColor.CRIMSON,
      },
      {
        id: 'n-1',
        x: 120,
        y: 90,
        title: 'Xuất thân / Bối cảnh',
        badge: 'Góc nhìn 1',
        color: MindmapBranchColor.GOLD,
      },
      {
        id: 'n-2',
        x: 720,
        y: 90,
        title: 'Chủ trương / Tư tưởng',
        badge: 'Góc nhìn 2',
        color: MindmapBranchColor.INDIGO,
      },
      {
        id: 'n-3',
        x: 120,
        y: 390,
        title: 'Sự kiện / Chiến công',
        badge: 'Góc nhìn 3',
        color: MindmapBranchColor.TEAL,
      },
      {
        id: 'n-4',
        x: 720,
        y: 390,
        title: 'Đánh giá & Di sản',
        badge: 'Góc nhìn 4',
        color: MindmapBranchColor.STONE,
      },
    ],
    edges: [
      { id: 'e-1', fromId: 'n-center', toId: 'n-1' },
      { id: 'e-2', fromId: 'n-center', toId: 'n-2' },
      { id: 'e-3', fromId: 'n-center', toId: 'n-3' },
      { id: 'e-4', fromId: 'n-center', toId: 'n-4' },
    ],
  }),

  [MindmapTemplateType.DOUBLE_BUBBLE]: (title, periodLabel) => ({
    nodes: [
      {
        id: 'n-left',
        x: 240,
        y: 240,
        title: `${title} (Đối tượng A)`,
        badge: periodLabel || 'Đối tượng 1',
        color: MindmapBranchColor.CRIMSON,
      },
      {
        id: 'n-right',
        x: 680,
        y: 240,
        title: 'Đối tượng B',
        badge: 'So sánh',
        color: MindmapBranchColor.INDIGO,
      },
      {
        id: 'n-same',
        x: 460,
        y: 90,
        title: 'Điểm tương đồng',
        badge: 'Chung',
        color: MindmapBranchColor.TEAL,
      },
      {
        id: 'n-diff-l',
        x: 40,
        y: 120,
        title: 'Điểm riêng của A',
        badge: 'Khác biệt',
        color: MindmapBranchColor.GOLD,
      },
      {
        id: 'n-diff-r',
        x: 880,
        y: 120,
        title: 'Điểm riêng của B',
        badge: 'Khác biệt',
        color: MindmapBranchColor.GOLD,
      },
    ],
    edges: [
      { id: 'e-1', fromId: 'n-left', toId: 'n-same', label: 'giống' },
      { id: 'e-2', fromId: 'n-right', toId: 'n-same', label: 'giống' },
      { id: 'e-3', fromId: 'n-left', toId: 'n-diff-l', label: 'riêng' },
      { id: 'e-4', fromId: 'n-right', toId: 'n-diff-r', label: 'riêng' },
    ],
  }),

  [MindmapTemplateType.BLANK]: (title, periodLabel) => ({
    nodes: [
      {
        id: 'n-root',
        x: 420,
        y: 240,
        title,
        badge: periodLabel || 'Chủ đề chính',
        color: MindmapBranchColor.CRIMSON,
      },
    ],
    edges: [],
  }),
};

/** Strategy Registry dựng bộ node & edge khởi tạo theo từng dạng sơ đồ tư duy Lịch sử. */
@Injectable()
export class MindmapTemplateRegistry {
  buildGraph(
    template: MindmapTemplateType,
    title: string,
    periodLabel?: string,
  ): MindmapGraphData {
    const builder =
      TEMPLATE_BUILDERS[template] ??
      TEMPLATE_BUILDERS[MindmapTemplateType.SPIDER];
    return builder(title, periodLabel);
  }
}
