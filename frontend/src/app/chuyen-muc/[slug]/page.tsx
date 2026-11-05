import { CategoryPage } from '@/features/public-articles/CategoryPage';

export default async function CategoryRoute({ params }: { params: Promise<{ slug: string }> }) {
  return <CategoryPage slug={(await params).slug} />;
}
