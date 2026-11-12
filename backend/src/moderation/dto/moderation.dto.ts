import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ReportRiskLevel,
  ReportSource,
  ReportTargetType,
} from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ModerationResolveAction, ModerationTab } from '../moderation.constant';

export class ListModerationReportsQueryDto {
  @ApiPropertyOptional({
    enum: ModerationTab,
    description: 'Bộ lọc tab trạng thái kiểm duyệt',
  })
  @IsOptional()
  @IsEnum(ModerationTab)
  tab?: ModerationTab;

  @ApiPropertyOptional({ enum: ReportSource })
  @IsOptional()
  @IsEnum(ReportSource)
  source?: ReportSource;

  @ApiPropertyOptional({ enum: ReportRiskLevel })
  @IsOptional()
  @IsEnum(ReportRiskLevel)
  riskLevel?: ReportRiskLevel;

  @ApiPropertyOptional({ enum: ReportTargetType })
  @IsOptional()
  @IsEnum(ReportTargetType)
  targetType?: ReportTargetType;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm theo tiêu đề, nội dung hoặc tác giả',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ResolveModerationReportDto {
  @ApiProperty({
    enum: ModerationResolveAction,
    description:
      'CONFIRM_REMOVE: Xác nhận xóa vi phạm | RESTORE: Khôi phục bài (AI bắt nhầm / Bác bỏ báo cáo) | BAN_USER: Khóa tài khoản tái phạm & xóa bài',
  })
  @IsEnum(ModerationResolveAction)
  action!: ModerationResolveAction;

  @ApiPropertyOptional({ description: 'Ghi chú của Admin/Moderator khi xử lý' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
