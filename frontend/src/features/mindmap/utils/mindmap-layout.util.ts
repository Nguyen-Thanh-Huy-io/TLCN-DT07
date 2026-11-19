import {
  MINDMAP_CANVAS,
  MindmapArrangeMode,
  MindmapEdgeStyle,
  NODE_SIZE_WIDTH,
} from '../constants/mindmap.constants';
import type { MindmapGraph, MindmapNode } from '../services/mindmap.service';

export function nodeWidthOf(node: MindmapNode): number {
  return node.size ? NODE_SIZE_WIDTH[node.size] : MINDMAP_CANVAS.NODE_WIDTH;
}

/** Tính đường SVG nối 2 node theo kiểu đường (Cong / Vuông góc / Thẳng). */
export function edgePathBetween(
  from: MindmapNode,
  to: MindmapNode,
  edgeStyle: MindmapEdgeStyle = MindmapEdgeStyle.BEZIER,
): { d: string; midX: number; midY: number } {
  const x1 = from.x + nodeWidthOf(from) / 2;
  const y1 = from.y + MINDMAP_CANVAS.NODE_HEIGHT / 2;
  const x2 = to.x + nodeWidthOf(to) / 2;
  const y2 = to.y + MINDMAP_CANVAS.NODE_HEIGHT / 2;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  if (edgeStyle === MindmapEdgeStyle.STRAIGHT) {
    return { d: `M ${x1} ${y1} L ${x2} ${y2}`, midX, midY };
  }
  if (edgeStyle === MindmapEdgeStyle.STEP) {
    return {
      d: `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`,
      midX,
      midY,
    };
  }
  const dx = (x2 - x1) * 0.5;
  return {
    d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
    midX,
    midY,
  };
}

function bfsLevels(graph: MindmapGraph): {
  root: MindmapNode;
  levels: Map<string, number>;
} {
  const incoming = new Set(graph.edges.map((e) => e.toId));
  const roots = graph.nodes.filter((n) => !incoming.has(n.id));
  const root = roots[0] ?? graph.nodes[0];

  const childrenMap = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const list = childrenMap.get(edge.fromId) ?? [];
    list.push(edge.toId);
    childrenMap.set(edge.fromId, list);
  }

  const levels = new Map<string, number>([[root.id, 0]]);
  const queue = [root.id];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const lvl = levels.get(curr) ?? 0;
    for (const childId of childrenMap.get(curr) ?? []) {
      if (!levels.has(childId)) {
        levels.set(childId, lvl + 1);
        queue.push(childId);
      }
    }
  }
  for (const n of graph.nodes) {
    if (!levels.has(n.id)) levels.set(n.id, 1);
  }
  return { root, levels };
}

/** Tự động sắp xếp theo 3 kiểu XMind: Cây ngang, 2 phía đối xứng, hoặc Xương cá. */
export function autoArrangeGraph(
  graph: MindmapGraph,
  mode: MindmapArrangeMode = MindmapArrangeMode.TREE,
): MindmapGraph {
  if (graph.nodes.length === 0) return graph;
  const { root, levels } = bfsLevels(graph);
  const positioned = new Map<string, { x: number; y: number }>();

  if (mode === MindmapArrangeMode.FISHBONE) {
    positioned.set(root.id, { x: 60, y: 260 });
    const others = graph.nodes.filter((n) => n.id !== root.id);
    others.forEach((n, idx) => {
      const col = Math.floor(idx / 2);
      const isTop = idx % 2 === 0;
      positioned.set(n.id, {
        x: 340 + col * 240,
        y: isTop ? 80 + (col % 2) * 30 : 410 - (col % 2) * 30,
      });
    });
  } else if (mode === MindmapArrangeMode.TWO_SIDED) {
    positioned.set(root.id, { x: 420, y: 260 });
    const others = graph.nodes.filter((n) => n.id !== root.id);
    const leftNodes = others.filter((_, i) => i % 2 === 0);
    const rightNodes = others.filter((_, i) => i % 2 === 1);
    const placeColumn = (list: MindmapNode[], x: number) => {
      const startY = Math.max(40, 260 - ((list.length - 1) * 125) / 2);
      list.forEach((n, i) => positioned.set(n.id, { x, y: Math.round(startY + i * 125) }));
    };
    placeColumn(leftNodes, 80);
    placeColumn(rightNodes, 760);
  } else {
    const byLevel = new Map<number, MindmapNode[]>();
    for (const n of graph.nodes) {
      const lvl = levels.get(n.id) ?? 0;
      const list = byLevel.get(lvl) ?? [];
      list.push(n);
      byLevel.set(lvl, list);
    }
    for (const [lvl, list] of byLevel.entries()) {
      const startY = Math.max(40, 260 - ((list.length - 1) * 128) / 2);
      list.forEach((n, idx) =>
        positioned.set(n.id, { x: 60 + lvl * 300, y: Math.round(startY + idx * 128) }),
      );
    }
  }

  return {
    ...graph,
    nodes: graph.nodes.map((n) => ({ ...n, ...(positioned.get(n.id) ?? {}) })),
  };
}

/** Tính pan & zoom để toàn bộ node nằm gọn và căn giữa trong khung canvas. */
export function computeFitViewport(
  nodes: MindmapNode[],
  viewportWidth: number,
  viewportHeight: number,
): { pan: { x: number; y: number }; zoom: number } {
  if (nodes.length === 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return { pan: { x: 0, y: 0 }, zoom: 1 };
  }
  const minX = Math.min(...nodes.map((n) => n.x));
  const minY = Math.min(...nodes.map((n) => n.y));
  const maxX = Math.max(...nodes.map((n) => n.x + nodeWidthOf(n)));
  const maxY = Math.max(...nodes.map((n) => n.y + MINDMAP_CANVAS.NODE_HEIGHT + 50));

  const contentW = Math.max(1, maxX - minX);
  const contentH = Math.max(1, maxY - minY);
  const pad = 48;

  const scaleX = (viewportWidth - pad * 2) / contentW;
  const scaleY = (viewportHeight - pad * 2) / contentH;
  const zoom = Math.max(
    MINDMAP_CANVAS.MIN_ZOOM,
    Math.min(1, Number(Math.min(scaleX, scaleY).toFixed(2))),
  );

  const panX = Math.round((viewportWidth - contentW * zoom) / 2 - minX * zoom);
  const panY = Math.round((viewportHeight - contentH * zoom) / 2 - minY * zoom);
  return { pan: { x: panX, y: panY }, zoom };
}
