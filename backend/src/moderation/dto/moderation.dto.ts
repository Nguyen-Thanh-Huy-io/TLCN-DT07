import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListModerationReportsQueryDto {
  @ApiPropertyOptional({
    enum: [
      'pending',
      'auto_hidden',
      'user_report',
      'removed',
      'dismissed',
      'all',
    ],
    description: 'Bộ lọc tab trạng thái kiểm duyệt',
  })
  @IsOptional()
  @IsIn([
    'pending',
    'auto_hidden',
    'user_report',
    'removed',
    'dismissed',
    'all',
  ])
  tab?:
    'pending' | 'auto_hidden' | 'user_report' | 'removed' | 'dismissed' | 'all';

  @ApiPropertyOptional({ enum: ['AI_SCAN', 'USER_REPORT'] })
  @IsOptional()
  @IsIn(['AI_SCAN', 'USER_REPORT'])
  source?: 'AI_SCAN' | 'USER_REPORT';

  @ApiPropertyOptional({ enum: ['SAFE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  @IsOptional()
  @IsIn(['SAFE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  riskLevel?: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiPropertyOptional({ enum: ['POST', 'COMMENT'] })
  @IsOptional()
  @IsIn(['POST', 'COMMENT'])
  targetType?: 'POST' | 'COMMENT';

  @ApiPropertyOptional({
    description: 'Từ khóa tìm theo tiêu đề, nội dung hoặc tác giả',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ResolveModerationReportDto {
  @ApiProperty({
    enum: ['CONFIRM_REMOVE', 'RESTORE', 'BAN_USER'],
    description:
      'CONFIRM_REMOVE: Xác nhận xóa vi phạm | RESTORE: Khôi phục bài (AI bắt nhầm / Bác bỏ báo cáo) | BAN_USER: Khóa tài khoản tái phạm & xóa bài',
  })
  @IsIn(['CONFIRM_REMOVE', 'RESTORE', 'BAN_USER'])
  action!: 'CONFIRM_REMOVE' | 'RESTORE' | 'BAN_USER';

  @ApiPropertyOptional({ description: 'Ghi chú của Admin/Moderator khi xử lý' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
