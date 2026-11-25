import type { Metadata } from 'next';
import { Header } from '@/components/hisgo/Header';
import { SpatialConceptCanvas } from '@/features/mindmap/components/SpatialConceptCanvas';
import type {
  SpatialCategorySeedGroup,
  SpatialSeedSuggestion,
} from '@/features/mindmap/components/SpatialCanvasParts';
import {
  fetchArticles,
  fetchCategories,
  fetchTopics,
  type PublicCategory,
  type PublicTopicRef,
} from '@/services/public/public-content.service';

export const metadata: Metadata = {
  title: 'Khám phá Không gian Lịch sử | HISGO',
  description:
    'Khám phá mối liên hệ nhân quả, chủ đề, nhân vật và sự kiện lịch sử trên không gian 2D vô tận cùng HISGO.',
};

const MAX_ITEMS_PER_VIEW = 6;

function collectTopicSeedsRecursive(
  parentId: string | null,
  parentTrail: string,
  childrenMap: Map<string | null, PublicTopicRef[]>,
  out: SpatialSeedSuggestion[],
): void {
  const nodes = childrenMap.get(parentId) ?? [];
  for (const node of nodes) {
    if (out.length >= MAX_ITEMS_PER_VIEW) return;
    const label = node.name.trim();
    if (label) {
      out.push({
        id: `topic-${node.id}`,
        label,
        subtitle: parentTrail || undefined,
      });
    }
  }
  for (const node of nodes) {
    if (out.length >= MAX_ITEMS_PER_VIEW) return;
    const nextTrail = parentTrail ? `${parentTrail} · ${node.name}` : node.name;
    collectTopicSeedsRecursive(node.id, nextTrail, childrenMap, out);
  }
}

function buildTopicSeeds(topics: PublicTopicRef[]): SpatialSeedSuggestion[] {
  const validIds = new Set(topics.map((t) => t.id));
  const childrenMap = new Map<string | null, PublicTopicRef[]>();

  for (const topic of topics) {
    const key = topic.parentId && validIds.has(topic.parentId) ? topic.parentId : null;
    const bucket = childrenMap.get(key) ?? [];
    bucket.push(topic);
    childrenMap.set(key, bucket);
  }

  const out: SpatialSeedSuggestion[] = [];
  collectTopicSeedsRecursive(null, '', childrenMap, out);
  return out;
}

async function buildCategorySeedGroups(
  categories: PublicCategory[],
): Promise<SpatialCategorySeedGroup[]> {
  const roots = categories
    .filter((cat) => !cat.parentId)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const groups = await Promise.all(
    roots.map(async (root) => {
      const articles = await fetchArticles({
        category: root.slug,
        limit: MAX_ITEMS_PER_VIEW,
      });
      const items: SpatialSeedSuggestion[] = articles.map((art) => ({
        id: `cat-art-${art.id}`,
        label: art.title,
        subtitle:
          [art.dateLabel ?? art.dateText, art.category?.name]
            .filter(Boolean)
            .join(' · ') || undefined,
        articleSlug: art.slug,
      }));
      return {
        slug: root.slug,
        name: root.name,
        items,
      };
    }),
  );

  return groups.filter((g) => g.items.length > 0);
}

export default async function KhamPhaKhaiNiemPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; articleSlug?: string }>;
}) {
  const [resolvedParams, topics, categories] = await Promise.all([
    searchParams,
    fetchTopics(),
    fetchCategories(),
  ]);

  const [topicSeeds, categoryGroups] = await Promise.all([
    Promise.resolve(buildTopicSeeds(topics)),
    buildCategorySeedGroups(categories),
  ]);

  return (
    <main className="min-h-screen bg-[#F5EEDC] text-[#1A120B]">
      <Header activeSectionId="explore" />
      <SpatialConceptCanvas
        initialQuery={resolvedParams.q}
        initialArticleSlug={resolvedParams.articleSlug}
        topicSeeds={topicSeeds}
        categoryGroups={categoryGroups}
      />
    </main>
  );
}
