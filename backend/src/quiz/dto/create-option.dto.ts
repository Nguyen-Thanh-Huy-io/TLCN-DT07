import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class CreateOptionDto {
  @ApiProperty({
    example: 'Năm 938',
    description: 'Nội dung văn bản của đáp án lựa chọn',
  })
  @IsString({ message: 'Nội dung đáp án phải là chuỗi' })
  @IsNotEmpty({ message: 'Nội dung đáp án không được để trống' })
  optionText: string;

  @ApiProperty({
    example: true,
    description: 'Đáp án này có chính xác hay không',
    default: false,
  })
  @IsBoolean({ message: 'isCorrect phải là boolean' })
  isCorrect: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự hiển thị của đáp án',
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'displayOrder phải là số nguyên' })
  @Min(0, { message: 'displayOrder không được nhỏ hơn 0' })
  displayOrder?: number;
}
