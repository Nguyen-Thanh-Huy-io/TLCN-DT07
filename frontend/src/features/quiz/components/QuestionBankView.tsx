'use client';

import { QuestionBankModal } from './QuestionBankModal';
import { useQuestionBankView } from './useQuestionBankView';
import { QuestionBankHeader, QuestionBankStats, QuestionBankFilters, QuestionBankTable } from './QuestionBankViewParts';

export function QuestionBankView() {
  const facade = useQuestionBankView();
  const { isModalOpen, setIsModalOpen, editingQuestion, fetchQuestions } = facade;

  return (
    <div className="space-y-5">
      {/* 1. Header Bar: Tiêu đề & Nút Thêm câu hỏi */}
      <QuestionBankHeader facade={facade} />

      {/* 2. Ribbon Thống kê nhanh */}
      <QuestionBankStats facade={facade} />

      {/* 3. Filter Bar */}
      <QuestionBankFilters facade={facade} />

      {/* 4. Table / List View */}
      <QuestionBankTable facade={facade} />

      {/* 6. Modal Tạo / Sửa câu hỏi (Dribbble Design) */}
      <QuestionBankModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchQuestions}
        initialQuestion={editingQuestion}
      />
    </div>
  );
}
