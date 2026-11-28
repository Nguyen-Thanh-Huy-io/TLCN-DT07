import { describe, it, expect } from 'vitest';
import {
  MindmapStructure,
  MindmapEdgeStyle,
} from '@/features/mindmap/constants/mindmap.constants';
import {
  computeMindmapLayout,
  type LayoutStrategyContext,
} from '@/features/mindmap/utils/mindmap-layout.strategy';
import { buildMindmapTree } from '@/features/mindmap/utils/mindmap-tree.util';
import type { MindmapGraph } from '@/features/mindmap/services/mindmap.service';

describe('TimelineLayoutStrategy (Dòng thời gian)', () => {
  it('tính toán bố cục trục ngang và nhánh so le trên/dưới theo mốc thời gian', () => {
    const graph: MindmapGraph = {
      structure: MindmapStructure.TIMELINE,
      nodes: [
        { id: 'root', title: 'Tiến trình Lịch sử', x: 0, y: 0, color: '#7A1F24' },
        { id: 'm1', title: 'Chiến thắng Bạch Đằng 1288', x: 0, y: 0, color: '#B8893F' },
        { id: 'm2', title: 'Chiến thắng Bạch Đằng 938', x: 0, y: 0, color: '#B8893F' },
        { id: 'm3', title: 'Chiến thắng Đống Đa 1789', x: 0, y: 0, color: '#B8893F' },
      ],
      edges: [
        { id: 'e1', fromId: 'root', toId: 'm1' },
        { id: 'e2', fromId: 'root', toId: 'm2' },
        { id: 'e3', fromId: 'root', toId: 'm3' },
      ],
    };

    const tree = buildMindmapTree(graph);
    const ctx: LayoutStrategyContext = {
      graph,
      tree,
      sizes: new Map(),
      structure: MindmapStructure.TIMELINE,
      balancedBranches: false,
      edgeStyle: MindmapEdgeStyle.STEP,
    };

    const result = computeMindmapLayout(ctx);

    // 1. Trục thời gian spineLine được sinh ra
    expect(result.spineLine).toBeDefined();
    expect(result.spineLine?.y1).toBe(0);
    expect(result.spineLine?.y2).toBe(0);
    expect(result.spineLine?.x2).toBeGreaterThan(result.spineLine?.x1 ?? 0);

    // 2. Node root đặt ở toạ độ x = 0
    const rootPlacement = result.placements.get('root');
    expect(rootPlacement).toBeDefined();
    expect(rootPlacement?.x).toBe(0);

    // 3. Sắp xếp mốc thời gian: m2 (938) < m1 (1288) < m3 (1789)
    const pM2 = result.placements.get('m2')!; // 938 (chỉ số 0 -> Top)
    const pM1 = result.placements.get('m1')!; // 1288 (chỉ số 1 -> Bottom)
    const pM3 = result.placements.get('m3')!; // 1789 (chỉ số 2 -> Top)

    expect(pM2).toBeDefined();
    expect(pM1).toBeDefined();
    expect(pM3).toBeDefined();

    // Hoành độ x tăng dần theo niên biểu
    expect(pM2.x).toBeLessThan(pM1.x);
    expect(pM1.x).toBeLessThan(pM3.x);

    // So le trên / dưới: idx 0 (m2) ở trên trục y < 0, idx 1 (m1) ở dưới trục y > 0, idx 2 (m3) ở trên trục y < 0
    expect(pM2.y).toBeLessThan(0);
    expect(pM1.y).toBeGreaterThan(0);
    expect(pM3.y).toBeLessThan(0);

    // 4. Đường nối vuông góc từ trục thời gian
    const edgeToM2 = result.routedEdges.get('e2');
    expect(edgeToM2).toBeDefined();
    expect(edgeToM2?.d).toMatch(/^M \d+ 0 L \d+ -?\d+/);
  });
});
