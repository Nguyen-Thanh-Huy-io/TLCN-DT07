import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ArticleKind } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Nhân vật' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'nhan-vat', description: 'Bỏ trống để tự sinh từ tên' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug chỉ gồm chữ thường, số và dấu gạch ngang' })
  slug?: string;

  @ApiPropertyOptional({ nullable: true, description: 'Chuyên mục cha (nếu là chuyên mục con)' })
  @IsOptional()
  @IsUUID('4')
  parentId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'User', nullable: true, description: 'Tên icon lucide' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string | null;

  @ApiPropertyOptional({
    enum: ArticleKind,
    nullable: true,
    description: 'Loại bài của chuyên mục; bỏ trống = kế thừa chuyên mục cha',
  })
  @IsOptional()
  @IsEnum(ArticleKind)
  kind?: ArticleKind | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
