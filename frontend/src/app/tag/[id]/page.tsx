import { PublicNotFound, PublicPageHeading, PublicShell } from '@/components/hisgo/PublicShell';
import { ArticleBrowser } from '@/features/public-articles/ArticleBrowser';
import { fetchArticles, fetchPublicTags } from '@/services/public/public-content.service';

export default async function TagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tags, articles] = await Promise.all([fetchPublicTags(), fetchArticles({ tag: id })]);
  const tag = tags.find((t) => t.id === id);

  if (!tag) {
    return (
      <PublicShell>
        <PublicNotFound eyebrow="Tag" title="Không tìm thấy tag" message="Tag này không tồn tại hoặc chưa có bài viết đã xuất bản." />
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <PublicPageHeading eyebrow="Tag" title={tag.name} description={tag.description} />
      <ArticleBrowser articles={articles} emptyText="Chưa có bài viết gắn tag này." />
    </PublicShell>
  );
}
