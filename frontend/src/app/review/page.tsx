import { Suspense } from 'react';
import { ReviewHubView } from '@/features/review/components/ReviewHubView';

export default function ReviewRoute() {
  return (
    <Suspense fallback={null}>
      <ReviewHubView />
    </Suspense>
  );
}
