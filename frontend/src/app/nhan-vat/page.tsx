import { redirect } from 'next/navigation';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';

export default async function NhanVatRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ nv?: string }>;
}) {
  const { nv } = await searchParams;
  if (nv) {
    redirect(PUBLIC_ROUTES.ARTICLE(nv));
  }
  redirect(PUBLIC_ROUTES.CATEGORY('nhan-vat'));
}
