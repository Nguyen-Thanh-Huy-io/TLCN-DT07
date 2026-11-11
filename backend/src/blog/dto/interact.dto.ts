import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * userId của like/bookmark/report được lấy từ JWT (req.user),
 * KHÔNG nhận từ body để tránh giả mạo.
 */
export class ReportPostDto {
  @ApiPropertyOptional({ description: 'Lý do báo cáo ngắn gọn', example: 'Nội dung xúc phạm danh dự cá nhân' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateCommunityProfileDto {
  @ApiPropertyOptional({ description: 'Họ và chữ đệm', example: 'Trần Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Tên', example: 'Khôi' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Tiểu sử & hướng nghiên cứu lịch sử',
    example: 'Nghiên cứu lịch sử kiến trúc thành lũy cổ đại và khảo cổ học Đông Dương.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
