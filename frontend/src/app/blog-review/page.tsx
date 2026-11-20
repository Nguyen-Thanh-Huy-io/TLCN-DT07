import { redirect } from 'next/navigation';
import { reviewHubRoute } from '@/constants/routes';
import { ReviewQueueType } from '@/services/entities/dashboard.service';

/** Đã gộp vào Hàng chờ duyệt. */
export default function BlogReviewPage() {
  redirect(reviewHubRoute(ReviewQueueType.BLOG));
}
