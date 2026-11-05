import { ArticleEditor } from '@/features/articles/components/ArticleEditor';

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  return <ArticleEditor articleId={(await params).id} />;
}
