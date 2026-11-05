import Link from 'next/link';
import { PublicNotFound, PublicPageHeading, PublicShell } from '@/components/hisgo/PublicShell';
import { fetchTopic } from '@/services/public/public-content.service';

/** Chủ đề (Topic) công khai: mô tả + chủ đề con. /kien-thuc/[slug] dùng lại trang này. */
export default async function ChapterDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = await fetchTopic(slug);

  if (!topic) {
    return (
      <PublicShell>
        <PublicNotFound eyebrow="Chủ đề" title="Không tìm thấy chủ đề" message={`Đường dẫn “${slug}” chưa có chủ đề đã xuất bản.`} />
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <PublicPageHeading eyebrow={topic.eyebrow ?? 'Chủ đề'} title={topic.name} description={topic.description} />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {topic.children.length === 0 ? (
          <p className="text-stone-500">Chủ đề chưa có chuyên đề con.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topic.children.map((child) => (
              <Link
                key={child.id}
                href={`/chuong-su/${child.slug}`}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-[#C9A27E]"
              >
                <h2 className="font-serif text-lg font-bold text-[#2D1A10]">{child.name}</h2>
                {child.description && <p className="mt-2 line-clamp-3 text-sm text-stone-600">{child.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
