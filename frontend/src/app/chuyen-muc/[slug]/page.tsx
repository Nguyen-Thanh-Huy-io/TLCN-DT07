import { notFound, redirect } from 'next/navigation';
import { CATEGORY_CANONICAL_ROUTES, PUBLIC_ROUTES } from '@/services/public/public-content.service';

export default async function CategoryRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (CATEGORY_CANONICAL_ROUTES[slug]) notFound();
  redirect(PUBLIC_ROUTES.CATEGORY(slug));
}
