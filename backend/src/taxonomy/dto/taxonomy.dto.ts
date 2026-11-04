import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTaxonomyTermDto {
  @ApiProperty({ example: 'SITE_TYPE' })
  @IsString()
  @MaxLength(50)
  groupCode: string;

  @ApiProperty({
    example: 'CITADEL',
    description: 'Mã viết hoa, chữ số và dấu gạch dưới',
  })
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Mã chỉ gồm chữ in hoa, chữ số và dấu gạch dưới',
  })
  code: string;

  @ApiProperty({ example: 'Thành lũy' })
  @IsString()
  @MaxLength(150)
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  inverseLabel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() displayOrder?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'Các cách ghi tự do / đồng nghĩa để tự quy đổi',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @ApiPropertyOptional() @IsOptional() @IsUUID() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() meta?: Record<
    string,
    unknown
  >;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

/** groupCode không đổi được sau khi tạo (đổi nhóm sẽ phá dữ liệu đang tham chiếu). */
export class UpdateTaxonomyTermDto extends PartialType(CreateTaxonomyTermDto) {}
