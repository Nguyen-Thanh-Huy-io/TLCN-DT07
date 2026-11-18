import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import {
  DashboardContentType,
  RecentActivityType,
  ReviewQueueType,
} from '../dashboard.constant';

export class ContentStatDto {
  @ApiProperty({ enum: DashboardContentType })
  type: DashboardContentType;

  @ApiProperty({ description: 'Tổng số' })
  total: number;

  @ApiPropertyOptional({
    description:
      'Số lượng theo trạng thái (ContentStatus); null với loại không có trạng thái (Đề thi)',
    example: {
      DRAFT: 2,
      PENDING_REVIEW: 1,
      PUBLISHED: 20,
      REJECTED: 0,
      ARCHIVED: 0,
    },
  })
  byStatus: Record<ContentStatus, number> | null;
}

export class MyRejectedItemDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: [ReviewQueueType.ARTICLE, ReviewQueueType.LESSON] })
  type: ReviewQueueType.ARTICLE | ReviewQueueType.LESSON;
  @ApiProperty() title: string;
  @ApiPropertyOptional() rejectionReason: string | null;
  @ApiProperty() updatedAt: Date;
}

/** Việc của chính người đang đăng nhập (bài học + bài viết do họ tạo). */
export class MyWorkDto {
  @ApiProperty({ description: 'Bản nháp của tôi' })
  drafts: number;

  @ApiProperty({ description: 'Bài của tôi đang chờ duyệt' })
  pending: number;

  @ApiProperty({ description: 'Tổng số bài của tôi bị từ chối' })
  rejectedCount: number;

  @ApiProperty({
    type: [MyRejectedItemDto],
    description: 'Bài bị từ chối mới nhất, kèm lý do',
  })
  rejected: MyRejectedItemDto[];
}

export class RecentActivityItemDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty({ enum: RecentActivityType }) type: RecentActivityType;
  @ApiProperty({ enum: ContentStatus }) status: ContentStatus;
  @ApiProperty({ description: 'Người tạo; "—" khi chưa lưu' })
  authorName: string;
  @ApiProperty() updatedAt: Date;
}

export class DashboardOverviewResponseDto {
  @ApiProperty({ type: [ContentStatDto] })
  contentStats: ContentStatDto[];

  @ApiProperty({
    description: 'Số việc chờ duyệt theo loại',
    example: { REVISION: 1, ARTICLE: 0, LESSON: 2, BLOG: 0, REPORT: 3 },
  })
  reviewCounts: Record<ReviewQueueType, number>;

  @ApiProperty({ type: MyWorkDto })
  myWork: MyWorkDto;

  @ApiProperty({ type: [RecentActivityItemDto] })
  recentActivities: RecentActivityItemDto[];
}
