import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Người dùng tự sửa hồ sơ — không gồm email, vai trò hay trạng thái. */
export class UpdateMyProfileDto {
  @ApiPropertyOptional({ example: 'Văn A' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Nguyễn' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Yêu thích lịch sử thời Lý – Trần.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;
}

export class ChangeMyPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: '≥ 8 ký tự, có hoa, thường, số, ký tự đặc biệt' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
