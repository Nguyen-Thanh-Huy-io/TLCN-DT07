import { BlogLandingPage } from '@/features/blog/components/BlogLandingPage';

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<{ author?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  return <BlogLandingPage author={resolvedParams?.author} />;
}
