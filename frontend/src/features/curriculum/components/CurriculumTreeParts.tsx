'use client';

import { CurriculumTreeFilter } from '@/constants/enums';
import { CurriculumNodeType, type AnyCurriculumNode, type CurriculumLessonNode, type CurriculumTopicNode } from '@/types/models';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/enums';
import type { CurriculumTreeProps } from './useCurriculumTree';
import { childTopicsOf, type CurriculumTreeFacade } from './useCurriculumTree';

export const SELECTED_NODE_STYLE = 'bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-300';

export const IDLE_NODE_STYLE = 'hover:bg-slate-50 text-slate-600';

export const SELECTED_ICON_CLASS = 'text-slate-900';

export const MUTED_ICON_CLASS = 'text-slate-400';

export const FILTER_BTN_ACTIVE = 'bg-slate-900 text-white';

export const FILTER_BTN_INACTIVE = 'bg-slate-100 text-slate-600 hover:bg-slate-200';

export const CHEVRON_BTN_BASE = 'p-0.5 rounded hover:bg-slate-200 text-slate-500 transition-transform';

export const ACTION_BTN_CLASS = 'tree-node-action p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900';

export const LESSON_COUNT_LABEL = ' bài';

export function CurriculumTreeHeader({ facade }: { facade: CurriculumTreeFacade }) {
  const { searchTerm, setSearchTerm, activeFilter, setActiveFilter, expandAll, collapseAll, totalRootTopics, totalSubTopics, totalLessons, missingQuizLessons } = facade;
  return (
    <div className="tree-header mb-2.5 pb-2.5 border-b border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-900 tracking-tight">
            Sơ đồ cây học tập
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {totalRootTopics} chủ đề chính • {totalSubTopics} chủ đề trực thuộc • {totalLessons}{LESSON_COUNT_LABEL}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="text-[11px] text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded border border-slate-200 bg-white transition-colors"
            onClick={expandAll}
            title="Mở rộng tất cả"
          >
            Mở hết
          </button>
          <button
            type="button"
            className="text-[11px] text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded border border-slate-200 bg-white transition-colors"
            onClick={collapseAll}
            title="Thu gọn tất cả"
          >
            Thu gọn
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-2">
        <input
          type="text"
          placeholder="Tìm theo chủ đề, bài học..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs py-1.5 pl-7 pr-6 border border-slate-200 rounded-md focus:outline-none focus:border-slate-800 bg-slate-50/70 text-slate-900 placeholder:text-slate-400"
        />
        <div className="absolute left-2.5 top-2 text-slate-400 pointer-events-none">
          <Icon name={IconName.SEARCH} size={12} />
        </div>
        {searchTerm ? (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-700 text-xs"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Quick Filter Pills */}
      <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
        <button
          type="button"
          className={`px-2 py-0.5 rounded transition-colors font-medium ${
            activeFilter === CurriculumTreeFilter.ALL
              ? FILTER_BTN_ACTIVE
              : FILTER_BTN_INACTIVE
          }`}
          onClick={() => setActiveFilter(CurriculumTreeFilter.ALL)}
        >
          Tất cả
        </button>
        <button
          type="button"
          className={`px-2 py-0.5 rounded transition-colors font-medium ${
            activeFilter === CurriculumTreeFilter.ROOT_ONLY
              ? FILTER_BTN_ACTIVE
              : FILTER_BTN_INACTIVE
          }`}
          onClick={() => {
            setActiveFilter(CurriculumTreeFilter.ROOT_ONLY);
            collapseAll();
          }}
        >
          Chủ đề chính
        </button>
        <button
          type="button"
          className={`px-2 py-0.5 rounded transition-colors font-medium ${
            activeFilter === CurriculumTreeFilter.HAS_LESSONS
              ? FILTER_BTN_ACTIVE
              : FILTER_BTN_INACTIVE
          }`}
          onClick={() => {
            setActiveFilter(CurriculumTreeFilter.HAS_LESSONS);
            expandAll();
          }}
        >
          Có bài học
        </button>
        {missingQuizLessons > 0 && (
          <button
            type="button"
            className={`px-2 py-0.5 rounded transition-colors font-medium flex items-center gap-1 ${
              activeFilter === CurriculumTreeFilter.NO_QUIZ
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
            onClick={() => {
              setActiveFilter(CurriculumTreeFilter.NO_QUIZ);
              expandAll();
            }}
            title="Lọc các bài học chưa có câu hỏi trắc nghiệm kiểm tra"
          >
            <span>Thiếu Quiz</span>
            <span className="bg-amber-200 text-amber-900 text-[9px] px-1 rounded-full font-bold">
              {missingQuizLessons}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

type TreeSelectionProps = Pick<CurriculumTreeProps, 'selectedNode' | 'onSelectNode' | 'onAddTopic' | 'onAddLesson'>;

/** Từ cấp 3 (chuyên đề) trở xuống, nút "+" thêm bài học thay vì thêm chủ đề con. */
const ADD_LESSON_FROM_DEPTH = 2;

const isNodeSelected = (selectedNode: AnyCurriculumNode | null, type: CurriculumNodeType, id: string) =>
  selectedNode?.type === type && selectedNode.id === id;

function LessonTreeRow({ lesson, selectedNode, onSelectNode }: { lesson: CurriculumLessonNode } & Pick<TreeSelectionProps, 'selectedNode' | 'onSelectNode'>) {
  const selected = isNodeSelected(selectedNode, CurriculumNodeType.LESSON, lesson.id);
  const label = lesson.name || lesson.title;
  return (
    <div
      className={`tree-node group flex items-center justify-between p-1 px-1.5 rounded-md cursor-pointer transition-colors ${selected ? SELECTED_NODE_STYLE : IDLE_NODE_STYLE}`}
      onClick={() => onSelectNode(lesson)}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1 pl-1">
        <Icon name={IconName.BOOK} size={11} className={selected ? SELECTED_ICON_CLASS : MUTED_ICON_CLASS} />
        <span className="text-[11px] truncate" title={label}>{label}</span>
      </div>
      {lesson.hasQuiz ? <span className="text-[9px] text-slate-400 font-mono ml-1">Quiz</span> : null}
    </div>
  );
}

function TopicTreeBranch({ topic, depth, facade, ...selection }: { topic: CurriculumTopicNode; depth: number; facade: CurriculumTreeFacade } & TreeSelectionProps) {
  const { selectedNode, onSelectNode, onAddTopic, onAddLesson } = selection;
  const children = childTopicsOf(topic);
  const lessons = topic.lessons || [];
  const hasChildren = children.length > 0 || lessons.length > 0;
  const isExpanded = !!facade.expanded[topic.id];
  const selected = isNodeSelected(selectedNode, CurriculumNodeType.TOPIC, topic.id);
  const isRoot = depth === 0;
  const addsLesson = depth >= ADD_LESSON_FROM_DEPTH;
  const countLabel = children.length > 0
    ? `${children.length} ${isRoot ? 'con' : 'chuyên đề'}`
    : `${lessons.length}${LESSON_COUNT_LABEL}`;

  return (
    <div className="topic-branch">
      <div
        className={`tree-node group flex items-center justify-between p-1.5 px-2 rounded-md cursor-pointer transition-colors ${selected ? SELECTED_NODE_STYLE : IDLE_NODE_STYLE}`}
        onClick={() => onSelectNode(topic)}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {hasChildren ? (
            <button type="button" className={`${CHEVRON_BTN_BASE} ${isExpanded ? 'rotate-90' : ''}`} onClick={(e) => facade.toggleNode(topic.id, e)}>
              <Icon name={IconName.CHEVRON} size={11} />
            </button>
          ) : (
            <span className="w-3.5 inline-block" />
          )}
          <Icon name={IconName.FOLDER} size={isRoot ? 14 : 12} className={selected ? SELECTED_ICON_CLASS : MUTED_ICON_CLASS} />
          <span className={`${isRoot ? 'text-xs' : 'text-[11.5px]'} truncate font-medium`} title={topic.name}>{topic.name}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-[10px] text-slate-400 font-mono">{countLabel}</span>
          <button
            type="button"
            title={addsLesson ? 'Thêm bài học vào chủ đề này' : 'Thêm chủ đề trực thuộc chủ đề này'}
            className={ACTION_BTN_CLASS}
            onClick={(e) => {
              e.stopPropagation();
              if (addsLesson) onAddLesson(topic.id);
              else onAddTopic(topic.id);
            }}
          >
            <Icon name={IconName.PLUS} size={11} />
          </button>
        </div>
      </div>

      {isExpanded && hasChildren ? (
        <div className="ml-3 pl-2.5 border-l border-slate-200 my-0.5 space-y-0.5">
          {children.map((child) => (
            <TopicTreeBranch key={child.id} topic={child} depth={depth + 1} facade={facade} {...selection} />
          ))}
          {lessons.map((lesson) => (
            <LessonTreeRow key={lesson.id} lesson={lesson} selectedNode={selectedNode} onSelectNode={onSelectNode} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CurriculumTreeContent({ facade, ...selection }: { facade: CurriculumTreeFacade } & TreeSelectionProps) {
  return (
    <div className="tree-content flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
      {facade.filteredData.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-500">Không tìm thấy chủ đề nào phù hợp.</div>
      ) : (
        facade.filteredData.map((rootTopic) => (
          <TopicTreeBranch key={rootTopic.id} topic={rootTopic} depth={0} facade={facade} {...selection} />
        ))
      )}
    </div>
  );
}
