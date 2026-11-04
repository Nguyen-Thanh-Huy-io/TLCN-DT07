import { ReviewList } from '@/features/review/components/ReviewList';
import { RevisionReviewList } from '@/features/review/components/RevisionReviewList';

export default function ReviewRoute() {
  return (
    <>
      <RevisionReviewList />
      <ReviewList />
    </>
  );
}
