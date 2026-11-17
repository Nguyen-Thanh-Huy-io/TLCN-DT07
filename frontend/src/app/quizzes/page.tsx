import { Suspense } from 'react';
import { QuizWorkspaceView } from '@/features/quiz/components/QuizWorkspaceView';

export default function QuizzesPage() {
  return (
    <Suspense fallback={null}>
      <QuizWorkspaceView />
    </Suspense>
  );
}
