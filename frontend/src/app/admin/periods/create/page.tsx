import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';

export default function CreatePeriodPage() {
  redirect(APP_ROUTES.TOPICS.CREATE);
}
