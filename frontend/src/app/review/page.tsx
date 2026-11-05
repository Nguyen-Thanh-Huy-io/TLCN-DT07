import { ArticleReviewList } from '@/features/review/components/ArticleReviewList';
import { ReviewList } from '@/features/review/components/ReviewList';
import { RevisionReviewList } from '@/features/review/components/RevisionReviewList';

export default function ReviewRoute() {
  return (
    <>
      <RevisionReviewList />
      <ArticleReviewList />
      <ReviewList />
    </>
  );
}
