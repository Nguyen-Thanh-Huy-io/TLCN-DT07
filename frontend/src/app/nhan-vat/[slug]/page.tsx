import { redirect } from 'next/navigation';

export default async function NhanVatSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/nhan-vat?nv=${encodeURIComponent(slug)}`);
}
