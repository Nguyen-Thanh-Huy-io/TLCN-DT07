import { describe, expect, it } from 'vitest';
import {
  MINDMAP_RECALL_STRATEGY_OPTIONS,
  MindmapBranchColor,
  MindmapCollapsePreset,
  MindmapRecallMode,
  MindmapRecallRating,
} from '@/features/mindmap/constants/mindmap.constants';
import type { MindmapGraph } from '@/features/mindmap/services/mindmap.service';
import {
  MindmapRecallStrategyRegistry,
  buildFlashcardsFromMindmapNodes,
} from '@/features/mindmap/utils/mindmap-recall.strategy';
import {
  applyCollapsePresetToGraph,
  buildMindmapTree,
} from '@/features/mindmap/utils/mindmap-tree.util';

function createSampleHistoryMindmap(): MindmapGraph {
  return {
    nodes: [
      {
        id: 'root',
        x: 0,
        y: 0,
        title: 'Chiến dịch Điện Biên Phủ 1954',
        dateLabel: '13/3 - 7/5/1954',
        color: MindmapBranchColor.CRIMSON,
      },
      {
        id: 'b1',
        x: 200,
        y: -80,
        title: 'Diễn biến 3 đợt tiến công',
        color: MindmapBranchColor.GOLD,
      },
      {
        id: 'leaf-1',
        x: 420,
        y: -120,
        title: 'Đợt 1: Tiêu diệt Him Lam và Độc Lập',
        dateLabel: '13/3 - 17/3/1954',
        note: 'Mở toang cánh cửa phía Bắc tập đoàn cứ điểm.',
        color: MindmapBranchColor.GOLD,
      },
      {
        id: 'leaf-2',
        x: 420,
        y: -40,
        title: 'Đợt 3: Tổng công kích bắt sống tướng De Castries',
        dateLabel: '1/5 - 7/5/1954',
        color: MindmapBranchColor.GOLD,
      },
      {
        id: 'sticky-1',
        x: -200,
        y: 120,
        title: 'Phương châm: Đánh chắc, tiến chắc',
        isStickyNote: true,
        color: MindmapBranchColor.STONE,
      },
    ],
    edges: [
      { id: 'e1', fromId: 'root', toId: 'b1' },
      { id: 'e2', fromId: 'b1', toId: 'leaf-1' },
      { id: 'e3', fromId: 'b1', toId: 'leaf-2' },
    ],
  };
}

describe('Mindmap Collapse Presets & Active Recall Strategies', () => {
  it('cấu hình đủ 3 chiến lược Gợi ý ôn tập đánh số 01, 02, 03 theo đúng thiết kế Popover', () => {
    expect(MINDMAP_RECALL_STRATEGY_OPTIONS.map((o) => o.stepNumber)).toEqual([
      '01',
      '02',
      '03',
    ]);
    expect(MINDMAP_RECALL_STRATEGY_OPTIONS[0].isRecommended).toBe(true);
  });

  it('applyCollapsePresetToGraph thu gọn chuẩn theo ROOT_ONLY, LEVEL_1 và EXPAND_ALL mà không ảnh hưởng Sticky Note', () => {
    const graph = createSampleHistoryMindmap();

    const rootOnly = applyCollapsePresetToGraph(
      graph,
      MindmapCollapsePreset.ROOT_ONLY,
    );
    expect(rootOnly.nodes.find((n) => n.id === 'root')?.collapsed).toBe(true);
    expect(rootOnly.nodes.find((n) => n.id === 'b1')?.collapsed).toBe(true);
    expect(rootOnly.nodes.find((n) => n.id === 'leaf-1')?.collapsed).toBeFalsy();

    const level1 = applyCollapsePresetToGraph(
      graph,
      MindmapCollapsePreset.LEVEL_1,
    );
    expect(level1.nodes.find((n) => n.id === 'root')?.collapsed).toBe(false);
    expect(level1.nodes.find((n) => n.id === 'b1')?.collapsed).toBe(true);

    const expanded = applyCollapsePresetToGraph(
      level1,
      MindmapCollapsePreset.EXPAND_ALL,
    );
    expect(expanded.nodes.every((n) => !n.collapsed)).toBe(true);
  });

  it('Chiến lược 01 (PROGRESSIVE_UNFOLD): thu gọn cây trên virtualGraph theo unfoldedIds và bảo toàn graph gốc', () => {
    const baseGraph = createSampleHistoryMindmap();
    const baseTree = buildMindmapTree(baseGraph);
    const strategy = MindmapRecallStrategyRegistry.get(
      MindmapRecallMode.PROGRESSIVE_UNFOLD,
    );

    const step0 = strategy.buildVirtualGraph(baseGraph, baseTree, {
      unfoldedIds: new Set(),
      revealedIds: new Set(),
      ratings: {},
    });
    expect(step0.nodes.find((n) => n.id === 'root')?.collapsed).toBe(true);
    expect(baseGraph.nodes.find((n) => n.id === 'root')?.collapsed).toBeUndefined();

    const step1 = strategy.buildVirtualGraph(baseGraph, baseTree, {
      unfoldedIds: new Set(['root']),
      revealedIds: new Set(),
      ratings: {},
    });
    expect(step1.nodes.find((n) => n.id === 'root')?.collapsed).toBe(false);
    expect(step1.nodes.find((n) => n.id === 'b1')?.collapsed).toBe(true);
  });

  it('Chiến lược 02 (BLUR_CLOZE): mở toàn bộ khung cây nhưng che mờ chữ/mốc/ghi chú cho đến khi click lật mở', () => {
    const baseGraph = createSampleHistoryMindmap();
    const baseTree = buildMindmapTree(baseGraph);
    const strategy = MindmapRecallStrategyRegistry.get(
      MindmapRecallMode.BLUR_CLOZE,
    );

    const leaf = baseGraph.nodes.find((n) => n.id === 'leaf-1')!;
    const root = baseGraph.nodes.find((n) => n.id === 'root')!;

    const rootMask = strategy.evaluateNodeMask(root, baseTree, baseGraph, {
      unfoldedIds: new Set(),
      revealedIds: new Set(),
      ratings: {},
    });
    expect(rootMask.isTestable).toBe(false);
    expect(rootMask.maskTitle).toBe(false);

    const hiddenMask = strategy.evaluateNodeMask(leaf, baseTree, baseGraph, {
      unfoldedIds: new Set(),
      revealedIds: new Set(),
      ratings: {},
    });
    expect(hiddenMask.isMasked).toBe(true);
    expect(hiddenMask.maskTitle).toBe(true);
    expect(hiddenMask.maskDateAndBadge).toBe(true);

    const revealedMask = strategy.evaluateNodeMask(leaf, baseTree, baseGraph, {
      unfoldedIds: new Set(),
      revealedIds: new Set(['leaf-1']),
      ratings: { 'leaf-1': MindmapRecallRating.REMEMBERED },
    });
    expect(revealedMask.isMasked).toBe(false);
    expect(revealedMask.rating).toBe(MindmapRecallRating.REMEMBERED);
  });

  it('Chiến lược 03 (DATE_DETAIL_ONLY): giữ rõ tiêu đề sự kiện nhưng che Mốc niên đại & Ghi chú', () => {
    const baseGraph = createSampleHistoryMindmap();
    const baseTree = buildMindmapTree(baseGraph);
    const strategy = MindmapRecallStrategyRegistry.get(
      MindmapRecallMode.DATE_DETAIL_ONLY,
    );

    const branchWithoutDate = baseGraph.nodes.find((n) => n.id === 'b1')!;
    const leafWithDate = baseGraph.nodes.find((n) => n.id === 'leaf-1')!;

    expect(strategy.isNodeTestable(branchWithoutDate, baseTree, baseGraph)).toBe(
      false,
    );
    expect(strategy.isNodeTestable(leafWithDate, baseTree, baseGraph)).toBe(true);

    const mask = strategy.evaluateNodeMask(leafWithDate, baseTree, baseGraph, {
      unfoldedIds: new Set(),
      revealedIds: new Set(),
      ratings: {},
    });
    expect(mask.maskTitle).toBe(false);
    expect(mask.maskDateAndBadge).toBe(true);
    expect(mask.maskNote).toBe(true);
  });

  it('buildFlashcardsFromMindmapNodes sinh thẻ SM-2 kèm ngữ cảnh nhánh cha và niên đại ở mặt sau', () => {
    const baseGraph = createSampleHistoryMindmap();
    const baseTree = buildMindmapTree(baseGraph);

    const cards = buildFlashcardsFromMindmapNodes(
      'Chiến dịch Điện Biên Phủ',
      baseGraph,
      baseTree,
      new Set(['leaf-1']),
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].front).toContain('Diễn biến 3 đợt tiến công');
    expect(cards[0].back).toContain('13/3 - 17/3/1954');
    expect(cards[0].back).toContain('Mở toang cánh cửa phía Bắc');
  });
});
