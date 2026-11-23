import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const COMMUNITY_MEMBERS_DEFAULT_LIMIT = 18;
export const COMMUNITY_MEMBERS_MAX_LIMIT = 50;

export enum CommunityMemberSort {
  CONTRIBUTION = 'contribution',
  FOLLOWERS = 'followers',
  NEWEST = 'newest',
}

export enum CommunityMemberFollowFilter {
  ALL = 'all',
  NOT_FOLLOWING = 'not_following',
  FOLLOWING = 'following',
}

export class ListCommunityMembersQueryDto {
  @ApiPropertyOptional({
    description: 'Trang hiện tại',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Số thành viên mỗi trang',
    default: COMMUNITY_MEMBERS_DEFAULT_LIMIT,
    maximum: COMMUNITY_MEMBERS_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(COMMUNITY_MEMBERS_MAX_LIMIT)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm theo tên, username hoặc tiểu sử',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    enum: CommunityMemberSort,
    default: CommunityMemberSort.CONTRIBUTION,
  })
  @IsOptional()
  @IsEnum(CommunityMemberSort)
  sort?: CommunityMemberSort;

  @ApiPropertyOptional({
    enum: CommunityMemberFollowFilter,
    default: CommunityMemberFollowFilter.ALL,
  })
  @IsOptional()
  @IsEnum(CommunityMemberFollowFilter)
  filter?: CommunityMemberFollowFilter;
}

/**
 * userId của like/bookmark/report được lấy từ JWT (req.user),
 * KHÔNG nhận từ body để tránh giả mạo.
 */
export class ReportPostDto {
  @ApiPropertyOptional({
    description: 'Lý do báo cáo ngắn gọn',
    example: 'Nội dung xúc phạm danh dự cá nhân',
  })
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
    example:
      'Nghiên cứu lịch sử kiến trúc thành lũy cổ đại và khảo cổ học Đông Dương.',
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
