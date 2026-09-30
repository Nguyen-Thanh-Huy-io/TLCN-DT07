import React from 'react';
import {
  AnyCurriculumNode,
  CurriculumNodeType,
  CurriculumPeriodNode,
  CurriculumTopicNode,
  CurriculumLessonNode,
} from '@/types/models/curriculum-tree.type';
import { Badge } from '@/components/common/Badge';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import {
  STATUS_LABEL_MAP,
  STATUS_TONE_MAP,
  DIFFICULTY_LABEL_MAP,
  DIFFICULTY_TONE_MAP,
} from '@/constants/ui-theme';

export interface DetailStrategyCallbacks {
  onAddChildTopic?: (periodId: string) => void;
  onAddChildLesson?: (periodId: string, topicId: string) => void;
  onSelectNode: (node: AnyCurriculumNode) => void;
  onEditNode: (node: AnyCurriculumNode) => void;
  onDeleteNode: (node: AnyCurriculumNode) => void;
}

/**
 * Strategy Interface for Curriculum Node Details (Open-Closed Principle)
 */
export interface INodeDetailStrategy {
  renderHeader(): React.ReactNode;
  renderOverview(): React.ReactNode;
  renderChildList(callbacks: DetailStrategyCallbacks): React.ReactNode;
  renderActionButtons(callbacks: DetailStrategyCallbacks): React.ReactNode;
}

/**
 * Strategy 1: Period Node Detail
 */
export class PeriodNodeDetailStrategy implements INodeDetailStrategy {
  constructor(private readonly period: CurriculumPeriodNode) {}

  renderHeader(): React.ReactNode {
    return (
      <div className="detail-header-card">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
            <Icon name={IconName.CLOCK} size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                GIAI ĐOẠN LỊCH SỬ
              </span>
              <Badge tone={STATUS_TONE_MAP[this.period.status]}>
                {STATUS_LABEL_MAP[this.period.status]}
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-1">
              {this.period.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {this.period.description || 'Chưa có mô tả chi tiết'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  renderOverview(): React.ReactNode {
    const totalLessons = this.period.topics.reduce(
      (acc, t) => acc + t.lessons.length,
      0,
    );
    const timeSpan =
      this.period.startYear !== undefined && this.period.endYear !== undefined
        ? `${this.period.startYear < 0 ? `${Math.abs(this.period.startYear)} TCN` : this.period.startYear} – ${this.period.endYear}`
        : 'Chưa xác định';

    return (
      <div className="grid grid-cols-4 gap-3 my-4">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-[10px] text-gray-400 font-semibold block uppercase">
            Niên đại
          </span>
          <strong className="text-xs text-gray-800 font-bold block mt-1">
            {timeSpan}
          </strong>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-[10px] text-gray-400 font-semibold block uppercase">
            Khu vực
          </span>
          <strong className="text-xs text-gray-800 font-bold block mt-1">
            {this.period.region || 'Việt Nam'}
          </strong>
        </div>
        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
          <span className="text-[10px] text-blue-500 font-semibold block uppercase">
            Số Chủ đề con
          </span>
          <strong className="text-xs text-blue-900 font-bold block mt-1">
            {this.period.topics.length} chủ đề
          </strong>
        </div>
        <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
          <span className="text-[10px] text-emerald-600 font-semibold block uppercase">
            Tổng số bài học
          </span>
          <strong className="text-xs text-emerald-900 font-bold block mt-1">
            {totalLessons} bài học
          </strong>
        </div>
      </div>
    );
  }

  renderChildList(callbacks: DetailStrategyCallbacks): React.ReactNode {
    return (
      <div className="child-list-section mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
            Danh sách Chủ đề thuộc giai đoạn này ({this.period.topics.length})
          </h3>
          <button
            type="button"
            className="secondary-button !h-7 !py-0 !px-2 !text-[10px]"
            onClick={() => callbacks.onAddChildTopic?.(this.period.id)}
          >
            <Icon name={IconName.PLUS} size={12} />
            <span>Thêm chủ đề con</span>
          </button>
        </div>

        {this.period.topics.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            Chưa có chủ đề nào trong giai đoạn này. Bấm nút phía trên để tạo chủ đề mới.
          </div>
        ) : (
          <div className="space-y-2">
            {this.period.topics.map((topic, idx) => (
              <div
                key={topic.id}
                className="p-3 bg-white hover:bg-blue-50/30 border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                onClick={() => callbacks.onSelectNode(topic)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-800 hover:text-blue-700">
                      {topic.name}
                    </h4>
                    <p className="text-[10px] text-gray-400">
                      {topic.description || 'Chưa có mô tả'} • {topic.lessons.length} bài học
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={STATUS_TONE_MAP[topic.status]}>
                    {STATUS_LABEL_MAP[topic.status]}
                  </Badge>
                  <Icon name={IconName.CHEVRON} size={14} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  renderActionButtons(callbacks: DetailStrategyCallbacks): React.ReactNode {
    return (
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
        <button
          type="button"
          className="primary-button !h-8 !text-xs"
          onClick={() => callbacks.onEditNode(this.period)}
        >
          <Icon name={IconName.EDIT} size={13} />
          <span>Sửa giai đoạn</span>
        </button>
        <button
          type="button"
          className="secondary-button !h-8 !text-xs text-red-600 hover:bg-red-50"
          onClick={() => callbacks.onDeleteNode(this.period)}
        >
          <Icon name={IconName.TRASH} size={13} />
          <span>Xóa</span>
        </button>
      </div>
    );
  }
}

/**
 * Strategy 2: Topic Node Detail
 */
export class TopicNodeDetailStrategy implements INodeDetailStrategy {
  constructor(private readonly topic: CurriculumTopicNode) {}

  renderHeader(): React.ReactNode {
    return (
      <div className="detail-header-card">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
            <Icon name={IconName.FOLDER} size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                CHỦ ĐỀ HỌC TẬP
              </span>
              <Badge tone={STATUS_TONE_MAP[this.topic.status]}>
                {STATUS_LABEL_MAP[this.topic.status]}
              </Badge>
              {this.topic.isSequential ? (
                <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 font-medium rounded">
                  Học tuần tự
                </span>
              ) : null}
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-1">
              {this.topic.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {this.topic.description || 'Chưa có mô tả chi tiết'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  renderOverview(): React.ReactNode {
    return (
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-[10px] text-gray-400 font-semibold block uppercase">
            Chế độ học
          </span>
          <strong className="text-xs text-gray-800 font-bold block mt-1">
            {this.topic.isSequential ? 'Tuần tự (Theo thứ tự)' : 'Tự do'}
          </strong>
        </div>
        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
          <span className="text-[10px] text-blue-500 font-semibold block uppercase">
            Số lượng bài học
          </span>
          <strong className="text-xs text-blue-900 font-bold block mt-1">
            {this.topic.lessons.length} bài
          </strong>
        </div>
        <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
          <span className="text-[10px] text-emerald-600 font-semibold block uppercase">
            Đề kiểm tra (Quiz)
          </span>
          <strong className="text-xs text-emerald-900 font-bold block mt-1">
            {this.topic.lessons.filter((l) => l.hasQuiz).length} bài có Quiz
          </strong>
        </div>
      </div>
    );
  }

  renderChildList(callbacks: DetailStrategyCallbacks): React.ReactNode {
    return (
      <div className="child-list-section mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
            Danh sách Bài học & Quiz trong chủ đề ({this.topic.lessons.length})
          </h3>
          <button
            type="button"
            className="secondary-button !h-7 !py-0 !px-2 !text-[10px]"
            onClick={() =>
              callbacks.onAddChildLesson?.(this.topic.periodId, this.topic.id)
            }
          >
            <Icon name={IconName.PLUS} size={12} />
            <span>Thêm bài học con</span>
          </button>
        </div>

        {this.topic.lessons.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            Chủ đề này chưa có bài học nào. Bấm nút phía trên để soạn bài học mới.
          </div>
        ) : (
          <div className="space-y-2">
            {this.topic.lessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                className="p-3 bg-white hover:bg-blue-50/30 border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                onClick={() => callbacks.onSelectNode(lesson)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-800 hover:text-blue-700">
                      {lesson.name}
                    </h4>
                    <p className="text-[10px] text-gray-400">
                      Thời lượng: ~{lesson.estimatedReadMinutes || 10} phút • {lesson.xpReward} XP
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={DIFFICULTY_TONE_MAP[lesson.difficulty]}>
                    {DIFFICULTY_LABEL_MAP[lesson.difficulty]}
                  </Badge>
                  {lesson.hasQuiz ? (
                    <span className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-700 font-semibold rounded border border-green-200">
                      Quiz ✓
                    </span>
                  ) : null}
                  <Badge tone={STATUS_TONE_MAP[lesson.status]}>
                    {STATUS_LABEL_MAP[lesson.status]}
                  </Badge>
                  <Icon name={IconName.CHEVRON} size={14} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  renderActionButtons(callbacks: DetailStrategyCallbacks): React.ReactNode {
    return (
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
        <button
          type="button"
          className="primary-button !h-8 !text-xs"
          onClick={() => callbacks.onEditNode(this.topic)}
        >
          <Icon name={IconName.EDIT} size={13} />
          <span>Sửa chủ đề</span>
        </button>
        <button
          type="button"
          className="secondary-button !h-8 !text-xs text-red-600 hover:bg-red-50"
          onClick={() => callbacks.onDeleteNode(this.topic)}
        >
          <Icon name={IconName.TRASH} size={13} />
          <span>Xóa</span>
        </button>
      </div>
    );
  }
}

/**
 * Strategy 3: Lesson Node Detail
 */
export class LessonNodeDetailStrategy implements INodeDetailStrategy {
  constructor(private readonly lesson: CurriculumLessonNode) {}

  renderHeader(): React.ReactNode {
    return (
      <div className="detail-header-card">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <Icon name={IconName.BOOK} size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                BÀI HỌC & QUIZ
              </span>
              <Badge tone={DIFFICULTY_TONE_MAP[this.lesson.difficulty]}>
                {DIFFICULTY_LABEL_MAP[this.lesson.difficulty]}
              </Badge>
              <Badge tone={STATUS_TONE_MAP[this.lesson.status]}>
                {STATUS_LABEL_MAP[this.lesson.status]}
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-1">
              {this.lesson.name}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  renderOverview(): React.ReactNode {
    return (
      <div className="grid grid-cols-4 gap-3 my-4">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-[10px] text-gray-400 font-semibold block uppercase">
            Thời lượng đọc
          </span>
          <strong className="text-xs text-gray-800 font-bold block mt-1">
            ~{this.lesson.estimatedReadMinutes || 10} phút
          </strong>
        </div>
        <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
          <span className="text-[10px] text-amber-600 font-semibold block uppercase">
            Phần thưởng XP
          </span>
          <strong className="text-xs text-amber-900 font-bold block mt-1">
            +{this.lesson.xpReward} XP
          </strong>
        </div>
        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
          <span className="text-[10px] text-blue-600 font-semibold block uppercase">
            Bài kiểm tra (Quiz)
          </span>
          <strong className="text-xs text-blue-900 font-bold block mt-1">
            {this.lesson.hasQuiz ? 'Đã đính kèm Quiz ✓' : 'Chưa có Quiz'}
          </strong>
        </div>
        <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
          <span className="text-[10px] text-purple-600 font-semibold block uppercase">
            Thứ tự hiển thị
          </span>
          <strong className="text-xs text-purple-900 font-bold block mt-1">
            Bài số {this.lesson.orderIndex}
          </strong>
        </div>
      </div>
    );
  }

  renderChildList(): React.ReactNode {
    return (
      <div className="space-y-4 mt-3">
        {/* Lesson Summary */}
        <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon name={IconName.BOOK} size={14} className="text-gray-600" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Tóm Tắt Nội Dung Bài Giảng
            </h3>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">
            {this.lesson.summary ||
              'Nội dung tóm tắt bài học lịch sử chưa được cập nhật. Nhấp "Mở trình soạn thảo bài học" để cập nhật nội dung văn bản, hình ảnh và tư liệu tương tác.'}
          </p>

          {this.lesson.relatedEntities && this.lesson.relatedEntities.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-gray-200/80 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-gray-400 font-semibold uppercase">
                Thực thể liên quan:
              </span>
              {this.lesson.relatedEntities.map((ent, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-white text-gray-700 border border-gray-200 shadow-2xs"
                >
                  {ent}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Bank Preview */}
        <div className="p-3.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Icon name={IconName.CHECK} size={15} className="text-emerald-600" />
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Ngân Hàng Câu Hỏi Quiz Đính Kèm
              </h3>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {this.lesson.quizQuestions?.length || (this.lesson.hasQuiz ? '2 câu hỏi' : 'Chưa có')}
            </span>
          </div>

          {this.lesson.quizQuestions && this.lesson.quizQuestions.length > 0 ? (
            <div className="space-y-3 mt-2">
              {this.lesson.quizQuestions.map((q, idx) => (
                <div key={idx} className="p-2.5 rounded-md bg-gray-50/70 border border-gray-200/80 text-xs">
                  <div className="font-semibold text-gray-900 mb-1.5 flex items-start gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#16385f] text-white text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{q.question}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-2 pl-5">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correctIndex;
                      return (
                        <div
                          key={oIdx}
                          className={`p-1.5 rounded text-[11px] flex items-center gap-1.5 ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold'
                              : 'bg-white text-gray-600 border border-gray-200'
                          }`}
                        >
                          <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                          <span className="truncate">{opt}</span>
                          {isCorrect && <span className="ml-auto text-emerald-600 font-bold">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-400 bg-gray-50/50 rounded border border-dashed border-gray-200">
              {this.lesson.hasQuiz
                ? 'Đã bật chế độ Quiz, đề thi đang được lưu trong hệ thống ngân hàng câu hỏi.'
                : 'Bài học này chưa được đính kèm câu hỏi trắc nghiệm kiểm tra. Bạn có thể thêm câu hỏi khi mở trình soạn thảo bài học.'}
            </div>
          )}
        </div>
      </div>
    );
  }

  renderActionButtons(callbacks: DetailStrategyCallbacks): React.ReactNode {
    return (
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
        <button
          type="button"
          className="primary-button !h-8 !text-xs"
          onClick={() => callbacks.onEditNode(this.lesson)}
        >
          <Icon name={IconName.EDIT} size={13} />
          <span>Mở trình soạn thảo bài học</span>
        </button>
        <button
          type="button"
          className="secondary-button !h-8 !text-xs text-red-600 hover:bg-red-50"
          onClick={() => callbacks.onDeleteNode(this.lesson)}
        >
          <Icon name={IconName.TRASH} size={13} />
          <span>Xóa</span>
        </button>
      </div>
    );
  }
}

/**
 * Factory for creating Node Detail Strategies (Factory Pattern)
 */
export class NodeDetailStrategyFactory {
  public static create(node: AnyCurriculumNode): INodeDetailStrategy {
    switch (node.type) {
      case CurriculumNodeType.PERIOD:
        return new PeriodNodeDetailStrategy(node);
      case CurriculumNodeType.TOPIC:
        return new TopicNodeDetailStrategy(node);
      case CurriculumNodeType.LESSON:
        return new LessonNodeDetailStrategy(node);
      default:
        throw new Error(`Unsupported curriculum node type`);
    }
  }
}
