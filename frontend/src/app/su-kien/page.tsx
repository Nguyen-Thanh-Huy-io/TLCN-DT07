import { redirect } from 'next/navigation';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';

export default function SuKienRedirectPage() {
  redirect(PUBLIC_ROUTES.CATEGORY('su-kien'));
}
