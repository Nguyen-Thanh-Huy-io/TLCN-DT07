import { describe, expect, it } from 'vitest';
import { groupPathsIntoTracks } from '@/features/public-curriculum/utils/curriculum-track.util';
import type { LearningPathItem } from '@/services/entities/learner.service';
import { ContentStatus } from '@/constants/enums';

function createMockPath(
  id: string,
  title: string,
  displayOrder: number,
  prerequisitePathId: string | null = null,
  lessonCount = 2,
): LearningPathItem {
  return {
    id,
    title,
    slug: id,
    description: `Mô tả cho ${title}`,
    coverImageUrl: `/assets/${id}.jpg`,
    pathType: 'CHRONOLOGICAL',
    isSequential: true,
    displayOrder,
    status: ContentStatus.PUBLISHED,
    prerequisitePathId,
    prerequisitePath: prerequisitePathId
      ? { id: prerequisitePathId, title: `Prereq of ${id}`, slug: prerequisitePathId }
      : null,
    successorPaths: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    chapters: [
      {
        id: `chap-${id}-1`,
        learningPathId: id,
        title: `Chương 1 của ${title}`,
        slug: `chap-${id}-1`,
        displayOrder: 1,
        chapterLessons: Array.from({ length: lessonCount }, (_, i) => ({
          id: `cl-${id}-${i + 1}`,
          chapterId: `chap-${id}-1`,
          lessonId: `lesson-${id}-${i + 1}`,
          displayOrder: i + 1,
          lesson: {
            id: `lesson-${id}-${i + 1}`,
            title: `Bài học ${i + 1} của ${title}`,
            slug: `lesson-${id}-${i + 1}`,
            description: null,
            summary: null,
            content: null,
            contentRichText: null,
            thumbnailUrl: null,
            difficulty: 'EASY',
            displayOrder: i + 1,
            status: ContentStatus.PUBLISHED,
            topicId: 'topic-1',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        })),
      },
    ],
  };
}

describe('Curriculum Track Utility - groupPathsIntoTracks', () => {
  it('trả về mảng rỗng khi không có lộ trình nào', () => {
    const tracks = groupPathsIntoTracks([]);
    expect(tracks).toEqual([]);
  });

  it('gom 1 chuỗi liên tục (A -> B -> C) thành 1 mạch tiến trình duy nhất gồm 3 chặng', () => {
    const pathA = createMockPath('path-a', 'Buổi đầu dựng nước', 1, null, 2);
    const pathB = createMockPath('path-b', 'Nghìn năm Bắc thuộc', 2, 'path-a', 3);
    const pathC = createMockPath('path-c', 'Thời đại Lý - Trần', 3, 'path-b', 4);

    const tracks = groupPathsIntoTracks([pathB, pathC, pathA]); // thứ tự truyền vào ngẫu nhiên

    expect(tracks).toHaveLength(1);
    const track = tracks[0];
    expect(track.id).toBe('path-a');
    expect(track.totalStages).toBe(3);
    expect(track.paths.map((p) => p.id)).toEqual(['path-a', 'path-b', 'path-c']);
    expect(track.totalChapters).toBe(3);
    expect(track.totalLessons).toBe(2 + 3 + 4); // 9 bài
  });

  it('tách thành 2-3 mạch độc lập khi có nhiều chuỗi hoặc lộ trình song song', () => {
    // Chuỗi 1: Lịch sử Việt Nam (VN1 -> VN2)
    const vn1 = createMockPath('vn-1', 'Lịch sử Việt Nam: Dựng nước', 1, null, 2);
    const vn2 = createMockPath('vn-2', 'Lịch sử Việt Nam: Bắc thuộc', 2, 'vn-1', 2);

    // Chuỗi 2: Lịch sử Thế giới (W1 -> W2)
    const w1 = createMockPath('w-1', 'Lịch sử Thế giới Cổ đại', 3, null, 3);
    const w2 = createMockPath('w-2', 'Lịch sử Thế giới Trung đại', 4, 'w-1', 3);

    // Lộ trình độc lập: Ôn thi THPT
    const thpt = createMockPath('thpt', 'Trọng tâm Ôn thi THPT Quốc gia', 5, null, 4);

    const tracks = groupPathsIntoTracks([vn1, w2, thpt, vn2, w1]);

    expect(tracks).toHaveLength(3);

    // Mạch 1: VN
    expect(tracks[0].id).toBe('vn-1');
    expect(tracks[0].totalStages).toBe(2);
    expect(tracks[0].paths.map((p) => p.id)).toEqual(['vn-1', 'vn-2']);

    // Mạch 2: World
    expect(tracks[1].id).toBe('w-1');
    expect(tracks[1].totalStages).toBe(2);
    expect(tracks[1].paths.map((p) => p.id)).toEqual(['w-1', 'w-2']);

    // Mạch 3: THPT
    expect(tracks[2].id).toBe('thpt');
    expect(tracks[2].totalStages).toBe(1);
    expect(tracks[2].paths.map((p) => p.id)).toEqual(['thpt']);
  });

  it('tính toán chính xác tiến độ hoàn thành và trạng thái đăng ký của mạch', () => {
    const p1 = createMockPath('p1', 'Giai đoạn 1', 1, null, 2);
    const p2 = createMockPath('p2', 'Giai đoạn 2', 2, 'p1', 2);

    // Giả lập đã hoàn thành 3 bài trong số 4 bài
    const completedLessonIds = new Set(['lesson-p1-1', 'lesson-p1-2', 'lesson-p2-1']);
    const isCompleted = (id: string) => completedLessonIds.has(id);
    const isEnrolled = (pathId: string) => pathId === 'p1';

    const tracks = groupPathsIntoTracks([p1, p2], { isCompleted, isEnrolled });

    expect(tracks).toHaveLength(1);
    const track = tracks[0];
    expect(track.totalLessons).toBe(4);
    expect(track.completedLessons).toBe(3);
    expect(track.progressPercent).toBe(75);
    expect(track.isCompleted).toBe(false);
    expect(track.isEnrolled).toBe(true);
  });
});
