import { LessonBlockType } from '../types/block-palette.types';
import { QuizBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, escapeHtml } from './block-plugin.types';

export const quizBlockPlugin: BlockPlugin<QuizBlockData> = {
  type: LessonBlockType.QUIZ,

  createDefault: (id: string, defaultWidth: BlockWidth): QuizBlockData => ({
    id,
    type: LessonBlockType.QUIZ,
    width: defaultWidth,
    question: 'Nhập nội dung câu hỏi ôn tập tại đây...',
    options: [
      { id: 'opt_1', text: 'Phương án A', isCorrect: true },
      { id: 'opt_2', text: 'Phương án B', isCorrect: false },
      { id: 'opt_3', text: 'Phương án C', isCorrect: false },
    ],
    explanation: 'Nhập giải thích đáp án tại đây...',
  }),

  toHtml: (block: QuizBlockData): string => {
    const options = block.options || [];
    const correctOpt = options.find((o) => o.isCorrect);
    const correctLetter = correctOpt ? String.fromCharCode(65 + options.indexOf(correctOpt)) : '';
    const safeQuestion = escapeHtml(block.question);
    const safeExplanation = block.explanation ? escapeHtml(block.explanation) : '';

    const optionsHtml = options
      .map(
        (opt, i) => `
        <div style="padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; display: flex; align-items: center; gap: 10px;">
          <span style="font-weight: 700; color: #b45309; min-width: 20px;">${String.fromCharCode(65 + i)}.</span>
          <span style="color: #334155;">${escapeHtml(opt.text)}</span>
        </div>`
      )
      .join('');

    return `
      <div class="my-6 p-5 bg-amber-50/60 border border-amber-200 rounded-2xl shadow-xs font-sans">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <span style="font-size: 15px;">❓</span>
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #b45309;">Câu hỏi tự kiểm tra nhanh</span>
        </div>
        <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin: 6px 0 14px 0; line-height: 1.5;">${safeQuestion}</p>
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13.5px;">
          ${optionsHtml}
        </div>
        <details style="margin-top: 14px; padding: 10px 14px; background: #fefce8; border: 1px dashed #ca8a04; border-radius: 10px; font-size: 13px;">
          <summary style="cursor: pointer; font-weight: 600; color: #854d0e; list-style: none;">
            ▸ Bấm để xem đáp án đúng & giải thích chi tiết
          </summary>
          <div style="margin-top: 8px; border-top: 1px solid #fef08a; padding-top: 8px; color: #713f12; line-height: 1.6;">
            <div><strong style="color: #15803d;">✓ Đáp án đúng:</strong> <strong>${correctLetter}. ${escapeHtml(correctOpt?.text || '')}</strong></div>
            ${safeExplanation ? `<div style="margin-top: 4px; color: #4b5563;">💡 <em>${safeExplanation}</em></div>` : ''}
          </div>
        </details>
      </div>`;
  },
};
