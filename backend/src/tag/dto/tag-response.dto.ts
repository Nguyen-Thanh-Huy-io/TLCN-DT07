import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'Kháng chiến chống Pháp' })
  name: string;

  @ApiPropertyOptional({ example: 'Mô tả nhãn' })
  description?: string;

  @ApiPropertyOptional({ example: '#FF5733' })
  colorHex?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
