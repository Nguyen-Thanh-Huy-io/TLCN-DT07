import { redirect } from 'next/navigation';
import { READER_SOURCE_PARAM, ReaderSource } from '@/constants/routes';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';

export default async function NhanVatSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`${PUBLIC_ROUTES.ARTICLE(slug)}?${READER_SOURCE_PARAM}=${ReaderSource.FIGURE}`);
}
