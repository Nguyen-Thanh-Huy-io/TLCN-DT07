import { ApiProperty } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';

export class DashboardCountsDto {
  @ApiProperty({ description: 'Tổng số bài viết', example: 120 })
  articlesCount: number;

  @ApiProperty({ description: 'Tổng số chủ đề', example: 48 })
  topicsCount: number;

  @ApiProperty({ description: 'Tổng số bài học', example: 126 })
  lessonsCount: number;

  @ApiProperty({ description: 'Số bài học đang chờ duyệt', example: 8 })
  pendingLessonsCount: number;

  @ApiProperty({ description: 'Tổng số dòng thời gian', example: 8 })
  timelinesCount: number;

  @ApiProperty({ description: 'Tổng số đơn vị tri thức', example: 250 })
  totalKnowledgeCount: number;
}

export class RecentActivityItemDto {
  @ApiProperty({ description: 'Mã định danh entity' })
  id: string;

  @ApiProperty({ description: 'Tiêu đề nội dung' })
  title: string;

  @ApiProperty({ description: 'Phân loại nội dung', enum: ['LESSON', 'TOPIC', 'ARTICLE'] })
  type: 'LESSON' | 'TOPIC' | 'ARTICLE';

  @ApiProperty({ description: 'Trạng thái nội dung' })
  status: ContentStatus | string;

  @ApiProperty({ description: 'Tên người thực hiện / người tạo' })
  authorName: string;

  @ApiProperty({ description: 'Thời gian cập nhật gần nhất' })
  updatedAt: Date | string;

  @ApiProperty({ description: 'Đường dẫn liên kết quản trị' })
  route: string;
}

export class PendingLessonItemDto {
  @ApiProperty({ description: 'ID bài học' })
  id: string;

  @ApiProperty({ description: 'Tiêu đề bài học' })
  title: string;

  @ApiProperty({ description: 'Tên chủ đề chứa bài học' })
  topicName: string;

  @ApiProperty({ description: 'Tên hoặc email người tạo' })
  creatorName: string;

  @ApiProperty({ description: 'Thời gian gửi duyệt' })
  createdAt: Date | string;
}

export class ContentDistributionDto {
  @ApiProperty({ description: 'Số bài học đã xuất bản (PUBLISHED)' })
  published: number;

  @ApiProperty({ description: 'Số bài học bản nháp (DRAFT)' })
  draft: number;

  @ApiProperty({ description: 'Số bài học chờ duyệt (PENDING_REVIEW)' })
  pendingReview: number;

  @ApiProperty({ description: 'Số bài học đã lưu trữ (ARCHIVED)' })
  archived: number;

  @ApiProperty({ description: 'Số bài học bị từ chối (REJECTED)' })
  rejected: number;
}

export class DashboardOverviewResponseDto {
  @ApiProperty({ type: DashboardCountsDto })
  counts: DashboardCountsDto;

  @ApiProperty({ type: [RecentActivityItemDto] })
  recentActivities: RecentActivityItemDto[];

  @ApiProperty({ type: [PendingLessonItemDto] })
  pendingLessons: PendingLessonItemDto[];

  @ApiProperty({ type: ContentDistributionDto })
  distribution: ContentDistributionDto;
}
