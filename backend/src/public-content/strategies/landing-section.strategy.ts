import { Injectable } from '@nestjs/common';
import { LearningPathType, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { PublicTopicDto } from '../dto/public-content.dto';
import { PublicContentMapper } from '../mappers/public-content.mapper';
import {
  LandingSection,
  PUBLIC_CONTENT_STATUS,
} from '../public-content.constant';

/**
 * Strategy cho từng section landing lấy dữ liệu từ Topic.
 * Thêm section mới = thêm 1 class kế thừa + đăng ký trong module (OCP).
 */
export interface LandingSectionStrategy {
  readonly section: LandingSection;
  fetch(): Promise<PublicTopicDto[]>;
}

/** Template Method: phần truy vấn chung, lớp con chỉ khai báo điều kiện lọc. */
abstract class TopicSectionStrategy implements LandingSectionStrategy {
  abstract readonly section: LandingSection;
  protected abstract readonly filter: Prisma.TopicWhereInput;

  constructor(private readonly prisma: PrismaService) {}

  async fetch(): Promise<PublicTopicDto[]> {
    const topics = await this.prisma.topic.findMany({
      where: { ...this.filter, status: PUBLIC_CONTENT_STATUS },
      orderBy: { displayOrder: 'asc' },
    });
    return topics.map((topic) => PublicContentMapper.toTopic(topic));
  }
}

/** "Những chặng sử đáng nhớ": chủ đề theo dòng thời gian được đánh dấu nổi bật. */
@Injectable()
export class ChaptersSectionStrategy extends TopicSectionStrategy {
  readonly section = LandingSection.CHAPTERS;
  protected readonly filter: Prisma.TopicWhereInput = {
    pathType: LearningPathType.CHRONOLOGICAL,
    isFeatured: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }
}

/** "Kiến thức lịch sử": chủ đề chuyên đề cấp gốc. */
@Injectable()
export class KnowledgeSectionStrategy extends TopicSectionStrategy {
  readonly section = LandingSection.KNOWLEDGE;
  protected readonly filter: Prisma.TopicWhereInput = {
    pathType: LearningPathType.THEMATIC,
    parentId: null,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
