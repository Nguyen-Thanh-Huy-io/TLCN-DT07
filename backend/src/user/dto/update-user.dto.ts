import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'Nguyễn', description: 'Tên người dùng' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Văn A', description: 'Họ và tên lót' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'Đam mê học hỏi và nghiên cứu lịch sử Việt Nam',
    description: 'Tiểu sử / Giới thiệu bản thân',
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL ảnh đại diện',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
