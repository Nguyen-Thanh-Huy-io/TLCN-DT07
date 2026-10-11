import {
  CurriculumTopicNode,
  CurriculumLessonNode,
  CurriculumNodeType,
} from '@/types/models/curriculum-tree.type';
import { LearningPathType } from '@/constants/enums';

/**
 * Chuyển đổi dữ liệu cây phân cấp từ Backend API sang CurriculumTopicNode
 * Dùng chung cho CurriculumExplorer, CurriculumTreePreviewModal,...
 */
export function mapBackendTopicTreeToCurriculum(topics: any[]): CurriculumTopicNode[] {
  if (!Array.isArray(topics)) return [];

  return topics.map((t, idx) => {
    const lessons: CurriculumLessonNode[] = (t.lessons || []).map((l: any, lIdx: number) => ({
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
      status: t.status,
      orderIndex: t.displayOrder ?? idx + 1,
      displayOrder: t.displayOrder ?? idx + 1,
      pathType: t.pathType || LearningPathType.CHRONOLOGICAL,
      parentId: t.parentId,
      periodId: t.periodId,
      subTopics,
      children: subTopics,
      lessons,
      updatedAt: t.updatedAt,
      period: t.period,
      _count: t._count,
    };
  });
}
