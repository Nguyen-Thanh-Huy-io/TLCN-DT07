import type { SubEra, TimeNode } from "./sk-types";

export const heroLandscape =
  "https://images.unsplash.com/photo-1686766219304-5e2fb0df9d2d?auto=format&fit=crop&w=1400&q=85";

export function sliceTimeNodes(subEra: SubEra, page: number, pageSize = 2): { nodes: TimeNode[]; hasMore: boolean } {
  return {
    nodes: subEra.timeNodes.slice(page * pageSize, (page + 1) * pageSize),
    hasMore: (page + 1) * pageSize < subEra.timeNodes.length,
  };
}
