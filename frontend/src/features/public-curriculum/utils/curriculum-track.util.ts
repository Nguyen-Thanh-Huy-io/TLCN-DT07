import type { LearningPathItem } from '@/services/entities/learner.service';
import { pathLessons } from '../components/hub/HubReaderParts';

export interface CurriculumTrackGroup {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  paths: LearningPathItem[];
  totalStages: number;
  totalChapters: number;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  isCompleted: boolean;
  isEnrolled: boolean;
}

export interface GroupPathsOptions {
  isCompleted?: (lessonId: string) => boolean;
  isEnrolled?: (pathId: string) => boolean;
}

/**
 * Phân nhóm danh sách các LearningPath có pathType = CHRONOLOGICAL thành các Mạch tiến trình (Tracks).
 * Thuật toán:
 * 1. Dựng đồ thị liên kết theo prerequisitePathId.
 * 2. Tìm các nút gốc (Root) của từng chuỗi (không có prerequisite hoặc trỏ ra ngoài danh sách).
 * 3. Duyệt theo thứ tự tuần tự để thu thập chuỗi các giai đoạn (Stages) của từng mạch.
 * 4. Tính toán chỉ số thống kê (số chặng, số chương, số bài, % hoàn thành) cho từng mạch.
 */
export function groupPathsIntoTracks(
  paths: LearningPathItem[],
  options: GroupPathsOptions = {},
): CurriculumTrackGroup[] {
  if (!paths || paths.length === 0) {
    return [];
  }

  const { isCompleted = () => false, isEnrolled = () => false } = options;

  const pathMap = new Map<string, LearningPathItem>();
  const childrenMap = new Map<string, string[]>();
  const hasParentInSet = new Set<string>();

  for (const path of paths) {
    pathMap.set(path.id, path);
    childrenMap.set(path.id, []);
  }

  // Xây dựng liên kết cha -> con
  for (const path of paths) {
    if (path.prerequisitePathId && pathMap.has(path.prerequisitePathId)) {
      childrenMap.get(path.prerequisitePathId)?.push(path.id);
      hasParentInSet.add(path.id);
    }
  }

  // Tìm các node gốc (Root nodes)
  const rootIds: string[] = [];
  for (const path of paths) {
    if (!hasParentInSet.has(path.id)) {
      rootIds.push(path.id);
    }
  }

  // Sắp xếp các root theo displayOrder của CurriculumTrack (nếu có), fallback về displayOrder của path
  rootIds.sort((a, b) => {
    const pathA = pathMap.get(a);
    const pathB = pathMap.get(b);
    const orderA = pathA?.track?.displayOrder ?? pathA?.displayOrder ?? 0;
    const orderB = pathB?.track?.displayOrder ?? pathB?.displayOrder ?? 0;
    return orderA - orderB;
  });

  const visited = new Set<string>();
  const tracks: CurriculumTrackGroup[] = [];

  for (const rootId of rootIds) {
    if (visited.has(rootId)) continue;

    const trackPaths: LearningPathItem[] = [];
    const queue: string[] = [rootId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const item = pathMap.get(currentId);
      if (item) {
        trackPaths.push(item);
      }

      // Lấy các con tiếp nối và sắp xếp theo displayOrder
      const children = (childrenMap.get(currentId) || [])
        .map((id) => pathMap.get(id))
        .filter((p): p is LearningPathItem => Boolean(p))
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((p) => p.id);

      for (const childId of children) {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      }
    }

    if (trackPaths.length === 0) continue;

    // Giữ nguyên thứ tự topo từ BFS theo prerequisitePathId (anh em cùng cấp đã sort theo displayOrder).
    const rootPath = trackPaths[0];

    // Tính toán số lượng và tiến độ
    let totalChapters = 0;
    let totalLessons = 0;
    let completedLessons = 0;
    let enrolledInTrack = false;

    for (const p of trackPaths) {
      totalChapters += (p.chapters || []).length;
      const lessons = pathLessons(p);
      totalLessons += lessons.length;
      completedLessons += lessons.filter((l) => isCompleted(l.id)).length;
      if (isEnrolled(p.id)) {
        enrolledInTrack = true;
      }
    }

    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const isTrackCompleted = totalLessons > 0 && completedLessons === totalLessons;

    // Tiêu đề & mô tả mạch hiển thị: ưu tiên CurriculumTrack từ DB (chuẩn 3NF), fallback về rootPath
    let trackTitle = rootPath.track?.title || rootPath.title;
    if (!rootPath.track?.title && trackPaths.length > 1 && !trackTitle.toLowerCase().startsWith('mạch')) {
      trackTitle = `Mạch tiến trình: ${rootPath.title}`;
    }

    const trackDescription =
      rootPath.track?.description ||
      rootPath.description ||
      `Hành trình gồm ${trackPaths.length} giai đoạn nối tiếp theo trình tự niên biểu lịch sử.`;

    tracks.push({
      id: rootPath.track?.id || rootPath.id,
      title: trackTitle,
      description: trackDescription,
      coverImageUrl: rootPath.coverImageUrl || null,
      paths: trackPaths,
      totalStages: trackPaths.length,
      totalChapters,
      totalLessons,
      completedLessons,
      progressPercent,
      isCompleted: isTrackCompleted,
      isEnrolled: enrolledInTrack,
    });
  }

  // Đảm bảo không sót path nào do đồ thị có chu trình bất thường
  for (const path of paths) {
    if (!visited.has(path.id)) {
      const lessons = pathLessons(path);
      const done = lessons.filter((l) => isCompleted(l.id)).length;
      tracks.push({
        id: path.id,
        title: path.title,
        description: path.description || 'Lộ trình tiến trình lịch sử độc lập.',
        coverImageUrl: path.coverImageUrl || null,
        paths: [path],
        totalStages: 1,
        totalChapters: (path.chapters || []).length,
        totalLessons: lessons.length,
        completedLessons: done,
        progressPercent: lessons.length ? Math.round((done / lessons.length) * 100) : 0,
        isCompleted: lessons.length > 0 && done === lessons.length,
        isEnrolled: isEnrolled(path.id),
      });
      visited.add(path.id);
    }
  }

  return tracks;
}
