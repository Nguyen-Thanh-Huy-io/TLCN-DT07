import { redirect } from 'next/navigation';
import { reviewHubRoute } from '@/constants/routes';
import { ReviewQueueType } from '@/services/entities/dashboard.service';

/** Đã gộp vào Hàng chờ duyệt (tab Báo cáo cộng đồng). */
export default function ModerationRoutePage() {
  redirect(reviewHubRoute(ReviewQueueType.REPORT));
}
