import { redirect } from 'next/navigation';
import { QuizWorkspaceTab, quizWorkspaceRoute } from '@/constants/routes';

/** Đường dẫn cũ: ngân hàng câu hỏi giờ là một tab của trang Đề thi. */
export default function QuestionsPage() {
  redirect(quizWorkspaceRoute(QuizWorkspaceTab.QUESTIONS));
}
