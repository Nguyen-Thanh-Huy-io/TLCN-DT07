'use client';

import { CurriculumTreeFilter } from '@/constants/enums';
import { CurriculumNodeType } from '@/types/models';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/enums';
import type { CurriculumTreeProps } from './useCurriculumTree';
import type { CurriculumTreeFacade } from './useCurriculumTree';

export const SELECTED_NODE_STYLE = 'bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-300';

export const IDLE_NODE_STYLE = 'hover:bg-slate-50 text-slate-600';

export const SELECTED_ICON_CLASS = 'text-slate-900';

export const MUTED_ICON_CLASS = 'text-slate-400';

export const FILTER_BTN_ACTIVE = 'bg-slate-900 text-white';

export const FILTER_BTN_INACTIVE = 'bg-slate-100 text-slate-600 hover:bg-slate-200';

export const CHEVRON_BTN_BASE = 'p-0.5 rounded hover:bg-slate-200 text-slate-500 transition-transform';

export const ACTION_BTN_CLASS = 'tree-node-action p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900';

export const ACTION_SUB_BTN_CLASS = 'tree-node-action p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900';

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

export function CurriculumTreeContent({ facade, selectedNode, onSelectNode, onAddTopic, onAddLesson }: { facade: CurriculumTreeFacade } & Pick<CurriculumTreeProps, 'selectedNode' | 'onSelectNode' | 'onAddTopic' | 'onAddLesson'>) {
  const { expandedTopics, expandedSubTopics, toggleTopic, toggleSubTopic, filteredData } = facade;
  return (
    <div className="tree-content flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
      {filteredData.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-500">
          Không tìm thấy chủ đề nào phù hợp.
        </div>
      ) : (
        filteredData.map((rootTopic) => {
          const subs = rootTopic.subTopics || rootTopic.children || [];
          const directLessons = rootTopic.lessons || [];
          const hasChildren = subs.length > 0 || directLessons.length > 0;
          const isExpanded = !!expandedTopics[rootTopic.id];
          const isSelected =
            selectedNode?.type === CurriculumNodeType.TOPIC &&
            selectedNode.id === rootTopic.id;

          return (
            <div key={rootTopic.id} className="topic-root-branch">
              {/* Level 1: Root Topic Node */}
              <div
                className={`tree-node group level-1 flex items-center justify-between p-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                  isSelected
                    ? SELECTED_NODE_STYLE
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
                onClick={() => onSelectNode(rootTopic)}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {hasChildren ? (
                    <button
                      type="button"
                      className={`${CHEVRON_BTN_BASE} ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                      onClick={(e) => toggleTopic(rootTopic.id, e)}
                    >
                      <Icon name={IconName.CHEVRON} size={11} />
                    </button>
                  ) : (
                    <span className="w-3.5 inline-block" />
                  )}
                  <Icon
                    name={IconName.FOLDER}
                    size={14}
                    className={isSelected ? SELECTED_ICON_CLASS : 'text-slate-600'}
                  />
                  <span className="text-xs truncate font-medium" title={rootTopic.name}>
                    {rootTopic.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {subs.length > 0 ? `${subs.length} con` : `${directLessons.length}${LESSON_COUNT_LABEL}`}
                  </span>
                  <button
                    type="button"
                    title="Thêm chủ đề trực thuộc chủ đề này"
                    className={ACTION_BTN_CLASS}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddTopic(rootTopic.id);
                    }}
                  >
                    <Icon name={IconName.PLUS} size={12} />
                  </button>
                </div>
              </div>

              {/* Level 2: Sub-topics & Direct Lessons */}
              {isExpanded && hasChildren ? (
                <div className="subtopics-container ml-3 pl-2.5 border-l border-slate-200 my-0.5 space-y-0.5">
                  {/* Render Sub-topics (Cấp 2: Giai đoạn) */}
                  {subs.map((subTopic) => {
                    const isSubExpanded = !!expandedSubTopics[subTopic.id];
                    const isSubSelected =
                      selectedNode?.type === CurriculumNodeType.TOPIC &&
                      selectedNode.id === subTopic.id;
                    const grandChildren = subTopic.subTopics || subTopic.children || [];
                    const subLessons = subTopic.lessons || [];
                    const hasSubChildren = grandChildren.length > 0 || subLessons.length > 0;

                    return (
                      <div key={subTopic.id} className="subtopic-branch">
                        <div
                          className={`tree-node group level-2 flex items-center justify-between p-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                            isSubSelected
                              ? SELECTED_NODE_STYLE
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                          onClick={() => onSelectNode(subTopic)}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {hasSubChildren ? (
                              <button
                                type="button"
                                className={`${CHEVRON_BTN_BASE} ${
                                  isSubExpanded ? 'rotate-90' : ''
                                }`}
                                onClick={(e) => toggleSubTopic(subTopic.id, e)}
                              >
                                <Icon name={IconName.CHEVRON} size={11} />
                              </button>
                            ) : (
                              <span className="w-3.5 inline-block" />
                            )}
                            <Icon
                              name={IconName.FOLDER}
                              size={12}
                              className={isSubSelected ? SELECTED_ICON_CLASS : MUTED_ICON_CLASS}
                            />
                            <span className="text-[11.5px] truncate font-medium" title={subTopic.name}>
                              {subTopic.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {grandChildren.length > 0
                                ? `${grandChildren.length} chuyên đề`
                                : `${subLessons.length}${LESSON_COUNT_LABEL}`}
                            </span>
                            <button
                              type="button"
                              title="Thêm chuyên đề hoặc bài học vào giai đoạn này"
                              className={ACTION_BTN_CLASS}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddTopic(subTopic.id);
                              }}
                            >
                              <Icon name={IconName.PLUS} size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Level 3: Chuyên đề (Grandchildren) & Direct Lessons */}
                        {isSubExpanded && hasSubChildren ? (
                          <div className="grand-container ml-3 pl-2.5 border-l border-slate-200 my-0.5 space-y-0.5">
                            {/* 1. Các chủ đề con Cấp 3 (Chuyên đề) */}
                            {grandChildren.map((grand) => {
                              const isGrandExpanded = !!expandedSubTopics[grand.id];
                              const isGrandSelected =
                                selectedNode?.type === CurriculumNodeType.TOPIC &&
                                selectedNode.id === grand.id;
                              const grandLessons = grand.lessons || [];

                              return (
                                <div key={grand.id} className="grandchild-branch">
                                  <div
                                    className={`tree-node group level-3 flex items-center justify-between p-1 px-2 rounded-md cursor-pointer transition-colors ${
                                      isGrandSelected
                                        ? SELECTED_NODE_STYLE
                                        : IDLE_NODE_STYLE
                                    }`}
                                    onClick={() => onSelectNode(grand)}
                                  >
                                    <div className="flex items-center gap-1 min-w-0 flex-1">
                                      {grandLessons.length > 0 ? (
                                        <button
                                          type="button"
                                          className={`${CHEVRON_BTN_BASE} ${
                                            isGrandExpanded ? 'rotate-90' : ''
                                          }`}
                                          onClick={(e) => toggleSubTopic(grand.id, e)}
                                        >
                                          <Icon name={IconName.CHEVRON} size={10} />
                                        </button>
                                      ) : (
                                        <span className="w-3 inline-block" />
                                      )}
                                      <Icon
                                        name={IconName.FOLDER}
                                        size={11}
                                        className={
                                          isGrandSelected ? SELECTED_ICON_CLASS : MUTED_ICON_CLASS
                                        }
                                      />
                                      <span
                                        className="text-[11px] truncate"
                                        title={grand.name}
                                      >
                                        {grand.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 ml-1.5">
                                      <span className="text-[9.5px] text-slate-400 font-mono">
                                        {grandLessons.length}{LESSON_COUNT_LABEL}
                                      </span>
                                      <button
                                        type="button"
                                        title="Thêm bài học vào chuyên đề này"
                                        className={ACTION_SUB_BTN_CLASS}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onAddLesson(grand.id);
                                        }}
                                      >
                                        <Icon name={IconName.PLUS} size={10} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Bài học thuộc Chuyên đề Cấp 3 */}
                                  {isGrandExpanded && grandLessons.length > 0 ? (
                                    <div className="lessons-container ml-3 pl-2 border-l border-slate-200 my-0.5 space-y-0.5">
                                      {grandLessons.map((lesson) => {
                                        const isLessonSelected =
                                          selectedNode?.type === CurriculumNodeType.LESSON &&
                                          selectedNode.id === lesson.id;

                                        return (
                                          <div
                                            key={lesson.id}
                                            className={`tree-node group level-4 flex items-center justify-between p-1 px-1.5 rounded-md cursor-pointer transition-colors ${
                                              isLessonSelected
                                                ? SELECTED_NODE_STYLE
                                                : IDLE_NODE_STYLE
                                            }`}
                                            onClick={() => onSelectNode(lesson)}
                                          >
                                            <div className="flex items-center gap-1.5 min-w-0 flex-1 pl-1">
                                              <Icon
                                                name={IconName.BOOK}
                                                size={11}
                                                className={
                                                  isLessonSelected
                                                    ? SELECTED_ICON_CLASS
                                                    : MUTED_ICON_CLASS
                                                }
                                              />
                                              <span
                                                className="text-[10.5px] truncate"
                                                title={lesson.name || lesson.title}
                                              >
                                                {lesson.name || lesson.title}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1 ml-1">
                                              {lesson.hasQuiz ? (
                                                <span className="text-[9px] text-slate-400 font-mono">
                                                  Quiz
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}

                            {/* 2. Các bài học trực tiếp thuộc Giai đoạn (nếu có) */}
                            {subLessons.map((lesson) => {
                              const isLessonSelected =
                                selectedNode?.type === CurriculumNodeType.LESSON &&
                                selectedNode.id === lesson.id;

                              return (
                                <div
                                  key={lesson.id}
                                  className={`tree-node group level-3 flex items-center justify-between p-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                                    isLessonSelected
                                      ? SELECTED_NODE_STYLE
                                      : IDLE_NODE_STYLE
                                  }`}
                                  onClick={() => onSelectNode(lesson)}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1 pl-2">
                                    <Icon
                                      name={IconName.BOOK}
                                      size={12}
                                      className={
                                        isLessonSelected ? SELECTED_ICON_CLASS : MUTED_ICON_CLASS
                                      }
                                    />
                                    <span
                                      className="text-[11.5px] truncate"
                                      title={lesson.name || lesson.title}
                                    >
                                      {lesson.name || lesson.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 ml-2">
                                    {lesson.hasQuiz ? (
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        Quiz
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  {/* Render Direct Lessons under Root Topic (if any) */}
                  {directLessons.map((lesson) => {
                    const isLessonSelected =
                      selectedNode?.type === CurriculumNodeType.LESSON &&
                      selectedNode.id === lesson.id;

                    return (
                      <div
                        key={lesson.id}
                        className={`tree-node group level-3 flex items-center justify-between p-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                          isLessonSelected
                            ? SELECTED_NODE_STYLE
                            : IDLE_NODE_STYLE
                        }`}
                        onClick={() => onSelectNode(lesson)}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 pl-3">
                          <Icon
                            name={IconName.BOOK}
                            size={12}
                            className={isLessonSelected ? SELECTED_ICON_CLASS : MUTED_ICON_CLASS}
                          />
                          <span
                            className="text-[11.5px] truncate"
                            title={lesson.name || lesson.title}
                          >
                            {lesson.name || lesson.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {lesson.hasQuiz ? (
                            <span className="text-[10px] text-slate-400 font-mono">Quiz</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
