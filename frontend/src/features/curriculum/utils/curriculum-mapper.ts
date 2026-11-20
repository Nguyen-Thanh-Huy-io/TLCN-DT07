import {
  CurriculumTopicNode,
  CurriculumLessonNode,
  CurriculumNodeType,
} from '@/types/models';
import type { TopicItem } from '@/types/models';
import { ContentStatus } from '@/constants/enums';

/**
 * Chuyển đổi dữ liệu cây phân cấp từ Backend API sang CurriculumTopicNode
 * Dùng chung cho CurriculumExplorer, CurriculumTreePreviewModal,...
 */
export function mapBackendTopicTreeToCurriculum(topics: TopicItem[]): CurriculumTopicNode[] {
  if (!Array.isArray(topics)) return [];

  return topics.map((t, idx) => {
    const lessons: CurriculumLessonNode[] = (t.lessons || []).map((l, lIdx) => ({
      id: l.id,
      type: CurriculumNodeType.LESSON,
      name: l.title || l.name || '',
      title: l.title || l.name || '',
      topicId: t.id,
      difficulty: l.difficulty,
      status: l.status,
      orderIndex: l.displayOrder ?? lIdx + 1,
      displayOrder: l.displayOrder ?? lIdx + 1,
      updatedAt: l.updatedAt,
      thumbnailUrl: l.thumbnailUrl,
      hasQuiz: false,
    }));

    const subTopics: CurriculumTopicNode[] = mapBackendTopicTreeToCurriculum(t.children || []);

    return {
      id: t.id,
      type: CurriculumNodeType.TOPIC,
      name: t.name,
      description: t.description,
      isSequential: t.isSequential ?? false,
      status: t.status ?? ContentStatus.DRAFT,
      orderIndex: t.displayOrder ?? idx + 1,
      displayOrder: t.displayOrder ?? idx + 1,
      parentId: t.parentId,
      subTopics,
      children: subTopics,
      lessons,
      updatedAt: t.updatedAt,
      _count: t._count,
    };
  });
}
