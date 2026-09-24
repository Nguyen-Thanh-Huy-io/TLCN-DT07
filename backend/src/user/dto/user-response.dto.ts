import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { userRole, userStatus } from '@prisma/client';

export class UserProfileResponseDto {
  @ApiPropertyOptional({ example: 'Nguyễn', description: 'Tên' })
  firstName?: string | null;

  @ApiPropertyOptional({ example: 'Văn A', description: 'Họ và tên lót' })
  lastName?: string | null;

  @ApiPropertyOptional({ example: 'Đam mê lịch sử', description: 'Tiểu sử' })
  bio?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Ảnh đại diện' })
  avatarUrl?: string | null;
}

export class UserResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'ID người dùng' })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email' })
  email: string;

  @ApiProperty({ example: 'history_learner', description: 'Username' })
  username: string;

  @ApiProperty({ enum: userRole, example: userRole.USER, description: 'Vai trò' })
  role: userRole;

  @ApiProperty({ example: true, description: 'Trạng thái xác thực email' })
  verified: boolean;

  @ApiProperty({ enum: userStatus, example: userStatus.ACTIVE, description: 'Trạng thái tài khoản' })
  status: userStatus;

  @ApiPropertyOptional({ type: UserProfileResponseDto, description: 'Thông tin hồ sơ' })
  userProfile?: UserProfileResponseDto | null;

  @ApiProperty({ example: '2026-09-24T00:00:00.000Z', description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-24T00:00:00.000Z', description: 'Ngày cập nhật' })
  updatedAt: Date;
}
