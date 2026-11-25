import { describe, expect, it } from 'vitest';
import {
  ConceptCanvasEngine,
  SPATIAL_LAYOUT,
  collectExploredPrompts,
  computeNextSpatialPosition,
  convertSpatialNodesToMindmapPayload,
  removeSpatialSubtree,
  stripConceptMarkdown,
  type SpatialCanvasNode,
} from '@/features/mindmap/services/concept-canvas.service';
import { MindmapMapTheme } from '@/features/mindmap/constants/mindmap.constants';

const SAMPLE_IMAGE = '/uploads/articles/bach-dang.jpg';
const SAMPLE_TITLE = 'Chiến thắng Bạch Đằng 938';
const SAMPLE_PERIOD = '938 · Thời Ngô';

function makeNode(
  id: string,
  parentId: string | null,
  prompt: string,
  x: number,
  y: number,
): SpatialCanvasNode {
  return {
    id,
    parentId,
    prompt,
    x,
    y,
    loading: false,
    error: null,
    versionIndex: 0,
    versions: [
      {
        periodLabel: SAMPLE_PERIOD,
        text: '**[Ngô Quyền](Ngô Quyền)** đánh bại quân Nam Hán trên [Sông Bạch Đằng](Sông Bạch Đằng).',
        prompts: ['Câu hỏi 1', 'Câu hỏi 2', 'Câu hỏi 3'],
        imageUrl: SAMPLE_IMAGE,
        engine: ConceptCanvasEngine.HISGO_DB_FALLBACK,
        matchedArticles: [
          {
            id: 'art-1',
            slug: 'bach-dang-938',
            title: SAMPLE_TITLE,
            summary: 'Chiến thắng mở đầu kỷ nguyên độc lập.',
            dateText: '938',
            coverImageUrl: SAMPLE_IMAGE,
            categoryName: 'Sự kiện lịch sử',
          },
        ],
        matchedTimelineNodes: [],
        webSources: [],
        animateText: false,
      },
    ],
  };
}

describe('concept-canvas.service pure helpers', () => {
  it('strips clickable concept markdown and bold markers cleanly', () => {
    const cleaned = stripConceptMarkdown(
      '**[Ngô Quyền (898 - 944)](Ngô Quyền (898 - 944))** bố trí cọc tại [Sông Bạch Đằng](Bạch Đằng 938).',
    );
    expect(cleaned).toBe('Ngô Quyền (898 - 944) bố trí cọc tại Sông Bạch Đằng.');
  });

  it('places root at default origin and shifts overlapping children downward', () => {
    const rootPos = computeNextSpatialPosition([], null, 1);
    expect(rootPos).toEqual({ x: SPATIAL_LAYOUT.ROOT_X, y: SPATIAL_LAYOUT.ROOT_Y });

    const root = makeNode('n1', null, 'Gốc', rootPos.x, rootPos.y);
    const firstChildPos = computeNextSpatialPosition([root], root, 1);
    expect(firstChildPos.x).toBe(root.x + SPATIAL_LAYOUT.CHILD_OFFSET_X);

    const child1 = makeNode('n2', 'n1', 'Nhánh 1', firstChildPos.x, firstChildPos.y);
    const secondSameSlotPos = computeNextSpatialPosition([root, child1], root, 1);
    expect(secondSameSlotPos.y).toBeGreaterThanOrEqual(
      firstChildPos.y + SPATIAL_LAYOUT.SHIFT_STEP_Y,
    );
  });

  it('removes a node and all of its descendants recursively while keeping siblings', () => {
    const n1 = makeNode('n1', null, 'Gốc', 100, 100);
    const n2 = makeNode('n2', 'n1', 'Nhánh A', 840, 100);
    const n3 = makeNode('n3', 'n2', 'Cháu A1', 1580, 100);
    const n4 = makeNode('n4', 'n1', 'Nhánh B', 840, 640);

    const remaining = removeSpatialSubtree([n1, n2, n3, n4], 'n2');
    expect(remaining.map((n) => n.id)).toEqual(['n1', 'n4']);
  });

  it('deduplicates explored prompts and converts tree into MindmapGraph payload', () => {
    const n1 = makeNode('n1', null, SAMPLE_TITLE, 120, 140);
    const n2 = makeNode('n2', 'n1', 'Ngô Quyền', 860, 140);
    const n3 = makeNode('n3', 'n1', 'Ngô Quyền', 860, 680);

    expect(collectExploredPrompts([n1, n2, n3])).toEqual([
      SAMPLE_TITLE,
      'Ngô Quyền',
    ]);

    const payload = convertSpatialNodesToMindmapPayload([n1, n2]);
    expect(payload.title).toBe(SAMPLE_TITLE);
    expect(payload.periodLabel).toBe(SAMPLE_PERIOD);
    expect(payload.graph.mapTheme).toBe(MindmapMapTheme.HISGO_HERITAGE);
    expect(payload.graph.nodes).toHaveLength(2);
    expect(payload.graph.nodes[0].note).toContain('Ngô Quyền đánh bại quân Nam Hán');
    expect(payload.graph.nodes[0].articleRef?.slug).toBe('bach-dang-938');
    expect(payload.graph.edges).toEqual([
      { id: 'e-spatial-1', fromId: 'n1', toId: 'n2' },
    ]);
  });
});
