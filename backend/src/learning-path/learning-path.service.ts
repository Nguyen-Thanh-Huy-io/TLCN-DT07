import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { SlugService } from '../common/services/slug.service';
import { PathPrerequisitePolicy } from './policies/path-prerequisite.policy';
import {
  CreateLearningPathDto,
  UpdateLearningPathDto,
} from './dto/create-learning-path.dto';
import {
  CreateCurriculumTrackDto,
  UpdateCurriculumTrackDto,
} from './dto/curriculum-track.dto';
import { CreateChapterDto, UpdateChapterDto } from './dto/create-chapter.dto';
import {
  ChapterQuizItemInputDto,
  ReorderChapterLessonsDto,
} from './dto/chapter-lesson-action.dto';

const CHAPTER_QUIZZES_INCLUDE = {
  orderBy: { displayOrder: 'asc' as const },
  include: {
    quiz: {
      select: {
        id: true,
        title: true,
        passingScorePercent: true,
        timeLimitMinutes: true,
        _count: { select: { quizQuestions: true } },
      },
    },
  },
};

@Injectable()
export class LearningPathService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slugService: SlugService,
    private readonly prerequisitePolicy: PathPrerequisitePolicy,
  ) {}

  // ==========================================
  // 0. CURRICULUM TRACK (MẠCH TIẾN TRÌNH)
  // ==========================================

  async findAllTracks() {
    return this.prisma.curriculumTrack.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        paths: {
          orderBy: [{ stageOrder: 'asc' }, { displayOrder: 'asc' }],
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            stageOrder: true,
            prerequisitePathId: true,
            stageExamQuizId: true,
            stageExamPassScore: true,
          },
        },
      },
    });
  }

  async createTrack(dto: CreateCurriculumTrackDto) {
    const slug = await this.slugService.generateUnique(
      dto.title,
      async (candidate) =>
        (await this.prisma.curriculumTrack.count({
          where: { slug: candidate },
        })) > 0,
    );

    return this.prisma.curriculumTrack.create({
      data: {
        title: dto.title.trim(),
        slug,
        description: dto.description?.trim(),
        coverImageUrl: dto.coverImageUrl,
        displayOrder: dto.displayOrder ?? 0,
        status: dto.status,
      },
    });
  }

  async updateTrack(id: string, dto: UpdateCurriculumTrackDto) {
    const existing = await this.prisma.curriculumTrack.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(
        `Mạch tiến trình với ID "${id}" không tồn tại`,
      );
    }

    return this.prisma.curriculumTrack.update({
      where: { id },
      data: {
        title: dto.title ? dto.title.trim() : undefined,
        description:
          dto.description !== undefined ? dto.description?.trim() : undefined,
        coverImageUrl: dto.coverImageUrl,
        displayOrder: dto.displayOrder,
        status: dto.status,
      },
    });
  }

  async deleteTrack(id: string) {
    const existing = await this.prisma.curriculumTrack.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(
        `Mạch tiến trình với ID "${id}" không tồn tại`,
      );
    }
    await this.prisma.curriculumTrack.delete({ where: { id } });
    return { success: true, message: `Đã xóa mạch tiến trình ID "${id}"` };
  }

  // ==========================================
  // 1. LEARNING PATH (LỘ TRÌNH HỌC)
  // ==========================================

  async findAllPaths() {
    return this.prisma.learningPath.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        track: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            displayOrder: true,
            status: true,
          },
        },
        stageExamQuiz: {
          select: {
            id: true,
            title: true,
            passingScorePercent: true,
            timeLimitMinutes: true,
          },
        },
        prerequisitePath: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        successorPaths: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        chapters: {
          orderBy: { displayOrder: 'asc' },
          include: {
            chapterQuizzes: CHAPTER_QUIZZES_INCLUDE,
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
                    topicId: true,
                    topic: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        parentId: true,
                      },
                    },
                    lessonTags: {
                      include: {
                        tag: true,
                      },
                    },
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
        track: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            displayOrder: true,
            status: true,
          },
        },
        stageExamQuiz: {
          select: {
            id: true,
            title: true,
            passingScorePercent: true,
            timeLimitMinutes: true,
          },
        },
        prerequisitePath: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        successorPaths: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        chapters: {
          orderBy: { displayOrder: 'asc' },
          include: {
            chapterQuizzes: CHAPTER_QUIZZES_INCLUDE,
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
                    topicId: true,
                    topic: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        parentId: true,
                      },
                    },
                    lessonTags: {
                      include: {
                        tag: true,
                      },
                    },
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
    if (dto.prerequisitePathId) {
      await this.prerequisitePolicy.assertNoCircularDependency(
        'new-path',
        dto.prerequisitePathId,
      );
    }

    const slug = await this.slugService.generateUnique(
      dto.title,
      async (candidate) =>
        (await this.prisma.learningPath.count({ where: { slug: candidate } })) >
        0,
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
        trackId: dto.trackId ?? null,
        stageOrder: dto.stageOrder ?? 0,
        prerequisitePathId: dto.prerequisitePathId ?? null,
        stageExamQuizId: dto.stageExamQuizId ?? null,
        stageExamPassScore: dto.stageExamPassScore ?? null,
      },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            displayOrder: true,
            status: true,
          },
        },
        stageExamQuiz: {
          select: {
            id: true,
            title: true,
            passingScorePercent: true,
            timeLimitMinutes: true,
          },
        },
        prerequisitePath: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        successorPaths: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        chapters: true,
      },
    });
  }

  async updatePath(id: string, dto: UpdateLearningPathDto) {
    await this.findPathById(id);

    if (dto.prerequisitePathId !== undefined) {
      await this.prerequisitePolicy.assertNoCircularDependency(
        id,
        dto.prerequisitePathId,
      );
    }

    return this.prisma.learningPath.update({
      where: { id },
      data: {
        title: dto.title ? dto.title.trim() : undefined,
        description:
          dto.description !== undefined ? dto.description?.trim() : undefined,
        coverImageUrl: dto.coverImageUrl,
        pathType: dto.pathType,
        isSequential: dto.isSequential,
        displayOrder: dto.displayOrder,
        status: dto.status,
        trackId: dto.trackId,
        stageOrder: dto.stageOrder,
        prerequisitePathId: dto.prerequisitePathId,
        stageExamQuizId: dto.stageExamQuizId,
        stageExamPassScore: dto.stageExamPassScore,
      },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            displayOrder: true,
            status: true,
          },
        },
        stageExamQuiz: {
          select: {
            id: true,
            title: true,
            passingScorePercent: true,
            timeLimitMinutes: true,
          },
        },
        prerequisitePath: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        successorPaths: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
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
      throw new NotFoundException(
        `Lộ trình học ID "${dto.learningPathId}" không tồn tại`,
      );
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

    const created = await this.prisma.chapter.create({
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
        chapterQuizzes: CHAPTER_QUIZZES_INCLUDE,
      },
    });

    if (dto.quizItems && dto.quizItems.length > 0) {
      const synced = await this.setChapterQuizzes(created.id, dto.quizItems);
      return { ...created, chapterQuizzes: synced.items };
    }

    return created;
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
        description:
          dto.description !== undefined ? dto.description?.trim() : undefined,
        displayOrder: dto.displayOrder,
        status: dto.status,
      },
      include: {
        chapterLessons: true,
        chapterQuizzes: CHAPTER_QUIZZES_INCLUDE,
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
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
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
    const startOrder = maxItem?.displayOrder ?? 0;

    const createdRecords = await this.prisma.$transaction(
      lessonIds.map((lessonId, idx) =>
        this.prisma.chapterLesson.upsert({
          where: {
            chapterId_lessonId: { chapterId, lessonId },
          },
          create: {
            chapterId,
            lessonId,
            displayOrder: startOrder + idx + 1,
          },
          update: {},
          include: {
            lesson: {
              select: { id: true, title: true, slug: true, status: true },
            },
          },
        }),
      ),
    );

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
      message:
        'Đã gỡ bài học khỏi chương (bài học vẫn được bảo toàn trong Thư viện Lesson)',
    };
  }

  async reorderChapterLessons(
    chapterId: string,
    dto: ReorderChapterLessonsDto,
  ) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
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

  // ==========================================
  // 4. CHAPTER QUIZZES (ĐỀ KIỂM TRA CHƯƠNG 0..N)
  // ==========================================

  async setChapterQuizzes(chapterId: string, items: ChapterQuizItemInputDto[]) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) {
      throw new NotFoundException(`Chương học ID "${chapterId}" không tồn tại`);
    }

    const deduped: ChapterQuizItemInputDto[] = [];
    const seenQuizIds = new Set<string>();
    for (const item of items ?? []) {
      const qid = item.quizId?.trim();
      if (!qid || seenQuizIds.has(qid)) continue;
      seenQuizIds.add(qid);
      deduped.push({
        quizId: qid,
        passScore: item.passScore ?? null,
        isRequired: item.isRequired ?? true,
      });
    }

    if (deduped.length > 0 && this.prisma.quiz) {
      const existingQuizzes = await this.prisma.quiz.findMany({
        where: { id: { in: deduped.map((i) => i.quizId) } },
        select: { id: true },
      });
      const existingSet = new Set(existingQuizzes.map((q) => q.id));
      const missingId = deduped.find((i) => !existingSet.has(i.quizId))?.quizId;
      if (missingId) {
        throw new NotFoundException(
          `Đề kiểm tra ID "${missingId}" không tồn tại`,
        );
      }
    }

    const updatedItems = await this.prisma.$transaction(async (tx) => {
      await tx.chapterQuiz.deleteMany({ where: { chapterId } });
      const createdList: Prisma.ChapterQuizGetPayload<{
        include: typeof CHAPTER_QUIZZES_INCLUDE.include;
      }>[] = [];
      for (let idx = 0; idx < deduped.length; idx++) {
        const entry = deduped[idx];
        const row = await tx.chapterQuiz.create({
          data: {
            chapterId,
            quizId: entry.quizId,
            displayOrder: idx + 1,
            passScore: entry.passScore ?? null,
            isRequired: entry.isRequired ?? true,
          },
          include: CHAPTER_QUIZZES_INCLUDE.include,
        });
        createdList.push(row);
      }
      return createdList;
    });

    return {
      success: true,
      count: updatedItems.length,
      items: updatedItems,
    };
  }
}
