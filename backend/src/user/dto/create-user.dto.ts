import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { userRole, userStatus } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Địa chỉ email người dùng',
  })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    example: 'history_learner',
    description: 'Tên tài khoản (duy nhất)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Username không được để trống' })
  username: string;

  @ApiProperty({
    example: 'Password@123',
    description: 'Mật khẩu khởi tạo (tối thiểu 6 ký tự)',
  })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;

  @ApiPropertyOptional({
    enum: userRole,
    example: userRole.USER,
    description: 'Vai trò người dùng trong hệ thống (USER, MODERATOR, ADMIN, SUPERADMIN)',
    default: userRole.USER,
  })
  @IsEnum(userRole)
  @IsOptional()
  role?: userRole = userRole.USER;

  @ApiPropertyOptional({
    enum: userStatus,
    example: userStatus.ACTIVE,
    description: 'Trạng thái tài khoản (ACTIVE, INACTIVE, SUSPENDED, BLOCKED)',
    default: userStatus.ACTIVE,
  })
  @IsEnum(userStatus)
  @IsOptional()
  status?: userStatus = userStatus.ACTIVE;
}
