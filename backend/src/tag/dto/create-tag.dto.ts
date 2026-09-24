import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'Kháng chiến chống Pháp', description: 'Tên nhãn/thẻ' })
  @IsNotEmpty({ message: 'Tên tag không được để trống' })
  @IsString({ message: 'Tên tag phải là chuỗi' })
  @MaxLength(100, { message: 'Tên tag không được vượt quá 100 ký tự' })
  name: string;

  @ApiPropertyOptional({ example: 'Các sự kiện và bài học liên quan đến cuộc kháng chiến chống Pháp (1945-1954)', description: 'Mô tả nhãn' })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiPropertyOptional({ example: '#FF5733', description: 'Mã màu Hex hiển thị trên UI' })
  @IsOptional()
  @IsString({ message: 'Mã màu phải là chuỗi' })
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Mã màu phải đúng định dạng Hex (ví dụ: #FF5733)' })
  colorHex?: string;
}
