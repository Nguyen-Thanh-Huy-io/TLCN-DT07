import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EntityType } from '@prisma/client';

export class CreateHistoricalEntityDto {
  @ApiProperty({
    example: 'Ngô Quyền',
    description: 'Tên thực thể lịch sử (nhân vật, triều đại, tổ chức, liên minh)',
    maxLength: 255,
  })
  @IsString({ message: 'Tên thực thể phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên thực thể không được để trống' })
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Ngô Vương',
    description: 'Tên tự, biệt hiệu, đế hiệu hoặc tên gốc bản ngữ',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  originalName?: string;

  @ApiPropertyOptional({
    enum: EntityType,
    example: EntityType.PERSON,
    description:
      'Loại thực thể (PERSON: Nhân vật, POLITY_STATE: Quốc gia/Triều đại, ORGANIZATION_PARTY: Tổ chức chính trị, FACTION_ALLIANCE: Liên minh, COMMUNITY_ETHNICITY: Bộ tộc/Cộng đồng)',
    default: EntityType.PERSON,
  })
  @IsEnum(EntityType, { message: 'type phải là giá trị hợp lệ của EntityType' })
  @IsOptional()
  type?: EntityType = EntityType.PERSON;

  @ApiPropertyOptional({
    example: 'Đại Việt',
    description: 'Quốc tịch / Xuất xứ (chủ yếu dùng cho PERSON)',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({
    example: 897,
    description: 'Năm sinh / Năm thành lập (Số nguyên, có thể âm)',
  })
  @Type(() => Number)
  @IsInt({ message: 'Năm bắt đầu phải là số nguyên' })
  @IsOptional()
  startYear?: number;

  @ApiPropertyOptional({
    example: 944,
    description: 'Năm mất / Năm kết thúc (Số nguyên, có thể âm)',
  })
  @Type(() => Number)
  @IsInt({ message: 'Năm kết thúc phải là số nguyên' })
  @IsOptional()
  endYear?: number;

  @ApiPropertyOptional({
    example: '897 - 944',
    description: 'Chuỗi niên đại hiển thị linh hoạt',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  timeDisplay?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/ngo-quyen.jpg',
    description: 'URL ảnh chân dung / biểu trưng',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 'Vị vua sáng lập ra nhà Ngô, người lãnh đạo trận Bạch Đằng năm 938...',
    description: 'Tiểu sử hoặc mô tả tóm tắt thực thể',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: { dynasty: 'Nhà Ngô', role: 'Vua sáng lập', temple: 'Đền Ngô Quyền tại Đường Lâm' },
    description: 'Metadata linh hoạt dạng JSON cho từng loại thực thể',
  })
  @IsOptional()
  metadata?: any;
}
