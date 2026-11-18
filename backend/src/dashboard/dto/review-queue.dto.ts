import { ApiProperty } from '@nestjs/swagger';
import { ReviewQueueType } from '../dashboard.constant';

export class ReviewQueueItemDto {
  @ApiProperty({
    description:
      'Id bản ghi cần xử lý (bài học, bài viết, bản sửa, bài blog, báo cáo)',
  })
  id: string;

  @ApiProperty({ enum: ReviewQueueType })
  type: ReviewQueueType;

  @ApiProperty() title: string;

  @ApiProperty({
    description: 'Người gửi / người báo cáo; "AI" với báo cáo tự động',
  })
  submitterName: string;

  @ApiProperty({ description: 'Lúc gửi duyệt / lúc báo cáo' })
  submittedAt: Date;
}

export class ReviewQueueResponseDto {
  @ApiProperty({
    example: { REVISION: 1, ARTICLE: 0, LESSON: 2, BLOG: 0, REPORT: 3 },
  })
  counts: Record<ReviewQueueType, number>;

  @ApiProperty({ description: 'Tổng số việc chờ duyệt' })
  total: number;

  @ApiProperty({
    type: [ReviewQueueItemDto],
    description: 'Việc chờ lâu nhất trước',
  })
  items: ReviewQueueItemDto[];
}
