import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateHistoricalReferenceDto {
  @ApiProperty({
    description: 'Tên sách, tài liệu, bài báo hoặc văn bản lịch sử',
    example: 'Đại Việt sử ký toàn thư',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Tác giả hoặc chủ biên',
    example: 'Ngô Sĩ Liên',
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({
    description: 'Nhà xuất bản hoặc cơ quan lưu trữ',
    example: 'NXB Khoa học Xã hội',
  })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({
    description: 'Năm xuất bản',
    example: 1993,
  })
  @IsOptional()
  @IsInt()
  publishYear?: number;

  @ApiPropertyOptional({
    description: 'Đường dẫn liên kết trực tuyến (nếu có)',
    example: 'https://vi.wikipedia.org/...',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    description: 'Mã chuẩn quốc tế ISBN (nếu là sách)',
    example: '978-604-0-12345-6',
  })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({
    description: 'Mã định danh số học thuật DOI (nếu là bài báo)',
  })
  @IsOptional()
  @IsString()
  doi?: string;

  @ApiPropertyOptional({
    description: 'Metadata bổ sung dạng JSON',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
