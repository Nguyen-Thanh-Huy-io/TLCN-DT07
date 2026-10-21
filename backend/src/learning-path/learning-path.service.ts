import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { SlugService } from '../common/services/slug.service';
import {
  CreateLearningPathDto,
  UpdateLearningPathDto,
} from './dto/create-learning-path.dto';
import { CreateChapterDto, UpdateChapterDto } from './dto/create-chapter.dto';
import { ReorderChapterLessonsDto } from './dto/chapter-lesson-action.dto';

@Injectable()
export class LearningPathService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slugService: SlugService,
  ) {}

  // ==========================================
  // 1. LEARNING PATH (LỘ TRÌNH HỌC)
  // ==========================================

  async findAllPaths() {
    return this.prisma.learningPath.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        chapters: {
          orderBy: { displayOrder: 'asc' },
          include: {
            chapterLessons: {
              orderBy: { displayOrder: 'asc' },
              include: {
                lesson: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    difficulty: true,
                    thumbnailUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findPathById(id: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { displayOrder: 'asc' },
          include: {
            chapterLessons: {
              orderBy: { displayOrder: 'asc' },
              include: {
                lesson: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    difficulty: true,
                    thumbnailUrl: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!path) {
      throw new NotFoundException(`Lộ trình học với ID "${id}" không tồn tại`);
    }

    return path;
  }

  async createPath(dto: CreateLearningPathDto) {
    const slug = await this.slugService.generateUnique(
      dto.title,
      async (candidate) =>
        (await this.prisma.learningPath.count({ where: { slug: candidate } })) > 0,
    );

    return this.prisma.learningPath.create({
      data: {
        title: dto.title.trim(),
        slug,
        description: dto.description?.trim(),
        coverImageUrl: dto.coverImageUrl,
        pathType: dto.pathType,
        isSequential: dto.isSequential ?? false,
        displayOrder: dto.displayOrder ?? 0,
        status: dto.status,
      },
      include: {
        chapters: true,
      },
    });
  }

  async updatePath(id: string, dto: UpdateLearningPathDto) {
    await this.findPathById(id);

    return this.prisma.learningPath.update({
      where: { id },
      data: {
        title: dto.title ? dto.title.trim() : undefined,
        description: dto.description !== undefined ? dto.description?.trim() : undefined,
        coverImageUrl: dto.coverImageUrl,
        pathType: dto.pathType,
        isSequential: dto.isSequential,
        displayOrder: dto.displayOrder,
        status: dto.status,
      },
      include: {
        chapters: true,
      },
    });
  }

  async deletePath(id: string) {
    await this.findPathById(id);
    await this.prisma.learningPath.delete({ where: { id } });
    return { success: true, message: `Đã xóa lộ trình học ID "${id}"` };
  }

  // ==========================================
  // 2. CHAPTER (CHƯƠNG HỌC)
  // ==========================================

  async createChapter(dto: CreateChapterDto) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: dto.learningPathId },
    });
    if (!path) {
      throw new NotFoundException(`Lộ trình học ID "${dto.learningPathId}" không tồn tại`);
    }

    const slug = await this.slugService.generateUnique(
      dto.title,
      async (candidate) =>
        (await this.prisma.chapter.count({
          where: { learningPathId: dto.learningPathId, slug: candidate },
        })) > 0,
    );

    // Tự động gán displayOrder kế tiếp nếu không truyền
    let order = dto.displayOrder;
    if (order === undefined || order === null) {
      const maxChapter = await this.prisma.chapter.findFirst({
        where: { learningPathId: dto.learningPathId },
        orderBy: { displayOrder: 'desc' },
      });
      order = (maxChapter?.displayOrder ?? 0) + 1;
    }

    return this.prisma.chapter.create({
      data: {
        learningPathId: dto.learningPathId,
        title: dto.title.trim(),
        slug,
        description: dto.description?.trim(),
        displayOrder: order,
        status: dto.status,
      },
      include: {
        chapterLessons: true,
      },
    });
  }

  async updateChapter(id: string, dto: UpdateChapterDto) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id } });
    if (!chapter) {
      throw new NotFoundException(`Chương học ID "${id}" không tồn tại`);
    }

    return this.prisma.chapter.update({
      where: { id },
      data: {
        title: dto.title ? dto.title.trim() : undefined,
        description: dto.description !== undefined ? dto.description?.trim() : undefined,
        displayOrder: dto.displayOrder,
        status: dto.status,
      },
      include: {
        chapterLessons: true,
      },
    });
  }

  async deleteChapter(id: string) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id } });
    if (!chapter) {
      throw new NotFoundException(`Chương học ID "${id}" không tồn tại`);
    }

    await this.prisma.chapter.delete({ where: { id } });
    return { success: true, message: `Đã xóa chương học ID "${id}"` };
  }

  // ==========================================
  // 3. CHAPTER LESSONS (GOM BÀI TỪ THƯ VIỆN & KÉO THẢ THỨ TỰ)
  // ==========================================

  async addLessonsToChapter(chapterId: string, lessonIds: string[]) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) {
      throw new NotFoundException(`Chương học ID "${chapterId}" không tồn tại`);
    }

    if (!lessonIds || lessonIds.length === 0) {
      throw new BadRequestException('Danh sách lessonIds không được để trống');
    }

    // Tìm displayOrder lớn nhất hiện tại trong chương
    const maxItem = await this.prisma.chapterLesson.findFirst({
      where: { chapterId },
      orderBy: { displayOrder: 'desc' },
    });
    let currentOrder = maxItem?.displayOrder ?? 0;

    const createdRecords: any[] = [];
    for (const lessonId of lessonIds) {
      currentOrder += 1;
      const record = await this.prisma.chapterLesson.upsert({
        where: {
          chapterId_lessonId: { chapterId, lessonId },
        },
        create: {
          chapterId,
          lessonId,
          displayOrder: currentOrder,
        },
        update: {},
        include: {
          lesson: {
            select: { id: true, title: true, slug: true, status: true },
          },
        },
      });
      createdRecords.push(record);
    }

    return {
      success: true,
      count: createdRecords.length,
      items: createdRecords,
    };
  }

  async removeLessonFromChapter(chapterId: string, lessonId: string) {
    const existing = await this.prisma.chapterLesson.findUnique({
      where: {
        chapterId_lessonId: { chapterId, lessonId },
      },
    });

    if (!existing) {
      throw new NotFoundException('Bài học không nằm trong chương này');
    }

    await this.prisma.chapterLesson.delete({
      where: {
        chapterId_lessonId: { chapterId, lessonId },
      },
    });

    return {
      success: true,
      message: 'Đã gỡ bài học khỏi chương (bài học vẫn được bảo toàn trong Thư viện Lesson)',
    };
  }

  async reorderChapterLessons(chapterId: string, dto: ReorderChapterLessonsDto) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) {
      throw new NotFoundException(`Chương học ID "${chapterId}" không tồn tại`);
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.chapterLesson.updateMany({
          where: {
            chapterId,
            lessonId: item.lessonId,
          },
          data: {
            displayOrder: item.displayOrder,
          },
        }),
      ),
    );

    return {
      success: true,
      message: 'Đã cập nhật thứ tự bài học trong chương thành công',
    };
  }
}
