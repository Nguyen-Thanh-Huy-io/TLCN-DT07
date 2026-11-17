'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Database, FileText } from 'lucide-react';
import { QUIZ_WORKSPACE_TAB_PARAM, QuizWorkspaceTab, quizWorkspaceRoute } from '@/constants/routes';
import { QuizManagementView } from './QuizManagementView';
import { QuestionBankView } from './QuestionBankView';

const TABS = [
  { key: QuizWorkspaceTab.QUIZZES, label: 'Đề thi', icon: FileText },
  { key: QuizWorkspaceTab.QUESTIONS, label: 'Ngân hàng câu hỏi', icon: Database },
] as const;

export function QuizWorkspaceView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab =
    searchParams.get(QUIZ_WORKSPACE_TAB_PARAM) === QuizWorkspaceTab.QUESTIONS
      ? QuizWorkspaceTab.QUESTIONS
      : QuizWorkspaceTab.QUIZZES;

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Đề thi và ngân hàng câu hỏi" className="flex gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => router.replace(quizWorkspaceRoute(key), { scroll: false })}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${
              tab === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === QuizWorkspaceTab.QUESTIONS ? <QuestionBankView /> : <QuizManagementView />}
    </div>
  );
}
