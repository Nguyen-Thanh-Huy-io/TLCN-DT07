'use client';

import { QuestionBankModal } from './QuestionBankModal';
import { useQuestionBankView } from './useQuestionBankView';
import { QuestionBankStats, QuestionBankFilters, QuestionBankTable } from './QuestionBankViewParts';

export function QuestionBankView() {
  const facade = useQuestionBankView();
  const { isModalOpen, setIsModalOpen, editingQuestion, fetchQuestions } = facade;

  return (
    <div className="space-y-5">
      <QuestionBankStats facade={facade} />
      <QuestionBankFilters facade={facade} />
      <QuestionBankTable facade={facade} />
      <QuestionBankModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchQuestions}
        initialQuestion={editingQuestion}
      />
    </div>
  );
}
