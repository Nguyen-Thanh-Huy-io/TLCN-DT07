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
      <div className="detail-header-card pb-3 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Icon name={IconName.CLOCK} size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded uppercase tracking-wider">
                Giai đoạn
              </span>
              <Badge tone={STATUS_TONE_MAP[this.period.status]}>
                {STATUS_LABEL_MAP[this.period.status]}
              </Badge>
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 mt-1">
              {this.period.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
        <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
            Niên đại
          </span>
          <strong className="text-xs text-slate-900 font-semibold block mt-0.5">
            {timeSpan}
          </strong>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
            Khu vực
          </span>
          <strong className="text-xs text-slate-900 font-semibold block mt-0.5">
            {this.period.region || 'Toàn cầu'}
          </strong>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
            Chủ đề con
          </span>
          <strong className="text-xs text-slate-900 font-semibold block mt-0.5">
            {this.period.topics.length} chủ đề
          </strong>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
            Tổng bài học
          </span>
          <strong className="text-xs text-slate-900 font-semibold block mt-0.5">
            {totalLessons} bài
          </strong>
        </div>
      </div>
    );
  }

  renderChildList(callbacks: DetailStrategyCallbacks): React.ReactNode {
    return (
      <div className="child-list-section mt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-slate-900">
            Danh sách Chủ đề ({this.period.topics.length})
          </h3>
          <button
            type="button"
            className="secondary-button !h-6 !py-0 !px-2 !text-[11px]"
            onClick={() => callbacks.onAddChildTopic?.(this.period.id)}
          >
            <Icon name={IconName.PLUS} size={11} />
            <span>Thêm chủ đề</span>
          </button>
        </div>

        {this.period.topics.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded border border-dashed border-slate-200">
            Chưa có chủ đề nào trong giai đoạn này.
          </div>
        ) : (
          <div className="space-y-1.5">
            {this.period.topics.map((topic, idx) => (
              <div
                key={topic.id}
                className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between cursor-pointer transition-colors"
                onClick={() => callbacks.onSelectNode(topic)}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 text-[11px] font-mono flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-medium text-slate-900 truncate">
                      {topic.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {topic.description || 'Chưa có mô tả'} • {topic.lessons.length} bài học
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={STATUS_TONE_MAP[topic.status]}>
                    {STATUS_LABEL_MAP[topic.status]}
                  </Badge>
                  <Icon name={IconName.CHEVRON} size={12} className="text-slate-400" />
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
      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
        <button
          type="button"
          className="primary-button !h-7 !text-xs !px-2.5"
          onClick={() => callbacks.onEditNode(this.period)}
        >
          <Icon name={IconName.EDIT} size={12} />
          <span>Sửa giai đoạn</span>
        </button>
        <button
          type="button"
          className="secondary-button !h-7 !text-xs !px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => callbacks.onDeleteNode(this.period)}
        >
          <Icon name={IconName.TRASH} size={12} />
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
      <div className="detail-header-card pb-3 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Icon name={IconName.FOLDER} size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded uppercase tracking-wider">
                Chủ đề
              </span>
              <Badge tone={STATUS_TONE_MAP[this.topic.status]}>
                {STATUS_LABEL_MAP[this.topic.status]}
              </Badge>
              {this.topic.isSequential ? (
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                  Tuần tự
                </span>
              ) : null}
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 mt-1">
              {this.topic.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
              {this.topic.description || 'Chưa có mô tả chi tiết'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  renderOverview(): React.ReactNode {
    const quizCount = this.topic.lessons.filter((l) => l.hasQuiz).length;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-3">
        <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
            Chế độ học
          </span>
          <strong className="text-xs text-slate-900 font-semibold block mt-0.5">
            {this.topic.isSequential ? 'Tuần tự' : 'Tự do'}
          </strong>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
            Số bài học
          </span>
          <strong className="text-xs text-slate-900 font-semibold block mt-0.5">
            {this.topic.lessons.length} bài
          </strong>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
            Bài có Quiz
          </span>
          <strong className="text-xs text-slate-900 font-semibold block mt-0.5">
            {quizCount} bài
          </strong>
        </div>
      </div>
    );
  }

  renderChildList(callbacks: DetailStrategyCallbacks): React.ReactNode {
    return (
      <div className="child-list-section mt-3 space-y-3">
        {/* Sub-topics if any */}
        {this.topic.subTopics && this.topic.subTopics.length > 0 ? (
          <div>
            <h3 className="text-xs font-semibold text-slate-900 mb-2">
              Chủ đề con ({this.topic.subTopics.length})
            </h3>
            <div className="space-y-1.5">
              {this.topic.subTopics.map((sub, idx) => (
                <div
                  key={sub.id}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between cursor-pointer transition-colors"
                  onClick={() => callbacks.onSelectNode(sub)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <Icon name={IconName.FOLDER} size={13} className="text-slate-500" />
                    <span className="text-xs font-medium text-slate-900 truncate">
                      {sub.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {sub.lessons.length} bài
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Lessons List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-900">
              Danh sách Bài học ({this.topic.lessons.length})
            </h3>
            <button
              type="button"
              className="secondary-button !h-6 !py-0 !px-2 !text-[11px]"
              onClick={() =>
                callbacks.onAddChildLesson?.(this.topic.periodId || '', this.topic.id)
              }
            >
              <Icon name={IconName.PLUS} size={11} />
              <span>Thêm bài học</span>
            </button>
          </div>

          {this.topic.lessons.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded border border-dashed border-slate-200">
              Chưa có bài học nào trong chủ đề này.
            </div>
          ) : (
            <div className="space-y-1.5">
              {this.topic.lessons.map((lesson, idx) => (
                <div
                  key={lesson.id}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between cursor-pointer transition-colors"
                  onClick={() => callbacks.onSelectNode(lesson)}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 text-[11px] font-mono flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-medium text-slate-900 truncate">
                        {lesson.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        ~{lesson.estimatedReadMinutes || 10} phút • +{lesson.xpReward} XP
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={DIFFICULTY_TONE_MAP[lesson.difficulty]}>
                      {DIFFICULTY_LABEL_MAP[lesson.difficulty]}
                    </Badge>
                    {lesson.hasQuiz ? (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Quiz
                      </span>
                    ) : null}
                    <Badge tone={STATUS_TONE_MAP[lesson.status]}>
                      {STATUS_LABEL_MAP[lesson.status]}
                    </Badge>
                    <Icon name={IconName.CHEVRON} size={12} className="text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  renderActionButtons(callbacks: DetailStrategyCallbacks): React.ReactNode {
    return (
      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
        <button
          type="button"
          className="primary-button !h-7 !text-xs !px-2.5"
          onClick={() => callbacks.onEditNode(this.topic)}
        >
          <Icon name={IconName.EDIT} size={12} />
          <span>Sửa chủ đề</span>
        </button>
        <button
          type="button"
          className="secondary-button !h-7 !text-xs !px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => callbacks.onDeleteNode(this.topic)}
        >
          <Icon name={IconName.TRASH} size={12} />
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
      <div className="detail-header-card pb-3 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Icon name={IconName.BOOK} size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded uppercase tracking-wider">
                Bài học
              </span>
              <Badge tone={DIFFICULTY_TONE_MAP[this.lesson.difficulty]}>
                {DIFFICULTY_LABEL_MAP[this.lesson.difficulty]}
              </Badge>
              <Badge tone={STATUS_TONE_MAP[this.lesson.status]}>
                {STATUS_LABEL_MAP[this.lesson.status]}
              </Badge>
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 mt-1">
              {this.lesson.name}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  renderOverview(): React.ReactNode {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
        <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
            Thời lượng đọc
          </span>
          <strong className="text-xs text-slate-900 font-semibold block mt-0.5">
            ~{this.lesson.estimatedReadMinutes || 10} phút
          </strong>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
            Thưởng XP
          </span>
          <strong className="text-xs text-slate-900 font-semibold block mt-0.5">
            +{this.lesson.xpReward} XP
          </strong>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
            Đề Quiz
          </span>
          <strong className="text-xs text-slate-900 font-semibold block mt-0.5">
            {this.lesson.hasQuiz ? 'Đã có' : 'Chưa có'}
          </strong>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
            Thứ tự
          </span>
          <strong className="text-xs text-slate-900 font-semibold block mt-0.5">
            Bài #{this.lesson.orderIndex}
          </strong>
        </div>
      </div>
    );
  }

  renderChildList(): React.ReactNode {
    return (
      <div className="space-y-3 mt-3">
        {/* Lesson Summary */}
        <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
          <h3 className="text-xs font-semibold text-slate-900 mb-1">
            Tóm tắt bài giảng
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {this.lesson.summary || 'Chưa cập nhật tóm tắt nội dung.'}
          </p>

          {this.lesson.relatedEntities && this.lesson.relatedEntities.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 uppercase font-medium">
                Thực thể:
              </span>
              {this.lesson.relatedEntities.map((ent, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded text-[11px] bg-white text-slate-700 border border-slate-200"
                >
                  {ent}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Bank Preview */}
        <div className="p-3 bg-white rounded-md border border-slate-200">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-900">
              Câu hỏi trắc nghiệm
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              {this.lesson.quizQuestions?.length || (this.lesson.hasQuiz ? '2 câu' : 'Chưa có')}
            </span>
          </div>

          {this.lesson.quizQuestions && this.lesson.quizQuestions.length > 0 ? (
            <div className="space-y-2 mt-2">
              {this.lesson.quizQuestions.map((q, idx) => (
                <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-medium text-slate-900 mb-1.5 flex items-start gap-1.5">
                    <span className="font-mono text-slate-500">#{idx + 1}</span>
                    <span>{q.question}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 pl-4">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correctIndex;
                      return (
                        <div
                          key={oIdx}
                          className={`p-1.5 rounded text-xs flex items-center gap-1.5 ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span className="font-mono text-slate-400">{String.fromCharCode(65 + oIdx)}.</span>
                          <span className="truncate">{opt}</span>
                          {isCorrect && <span className="ml-auto text-emerald-700 text-[10px]">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded border border-dashed border-slate-200">
              {this.lesson.hasQuiz
                ? 'Đề thi đã lưu trong hệ thống.'
                : 'Bài học này chưa có câu hỏi trắc nghiệm.'}
            </div>
          )}
        </div>
      </div>
    );
  }

  renderActionButtons(callbacks: DetailStrategyCallbacks): React.ReactNode {
    return (
      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
        <button
          type="button"
          className="primary-button !h-7 !text-xs !px-2.5"
          onClick={() => callbacks.onEditNode(this.lesson)}
        >
          <Icon name={IconName.EDIT} size={12} />
          <span>Mở trình soạn thảo bài học</span>
        </button>
        <button
          type="button"
          className="secondary-button !h-7 !text-xs !px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => callbacks.onDeleteNode(this.lesson)}
        >
          <Icon name={IconName.TRASH} size={12} />
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
