import { BlogDetailPage } from '@/features/blog/components/BlogDetailPage';

export default async function BlogDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogDetailPage slug={slug} />;
}
