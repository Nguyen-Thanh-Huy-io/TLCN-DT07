import { Suspense } from 'react';
import { QuizWorkspaceView } from '@/features/quiz/components/QuizPreviewModal';

export default function QuizzesPage() {
  return (
    <Suspense fallback={null}>
      <QuizWorkspaceView />
    </Suspense>
  );
}
