import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  registerDecorator,
  type ValidationOptions,
} from 'class-validator';
import {
  MINDMAP_LIMITS,
  MINDMAP_MESSAGES,
  MindmapTemplateType,
} from '../mindmap.constant';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

function MaxJsonBytes(maxBytes: number, options?: ValidationOptions) {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: 'maxMindmapGraphBytes',
      target: target.constructor,
      propertyName,
      options: { message: MINDMAP_MESSAGES.GRAPH_TOO_LARGE, ...options },
      validator: {
        validate: (value: unknown) =>
          Buffer.byteLength(JSON.stringify(value ?? null), 'utf8') <= maxBytes,
      },
    });
}

export class CreateMindmapDto {
  @ApiProperty({ example: 'Vương triều Nhà Trần' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MINDMAP_LIMITS.MAX_TITLE_LENGTH)
  title: string;

  @ApiPropertyOptional({ example: '1225 – 1400' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(MINDMAP_LIMITS.MAX_PERIOD_LENGTH)
  periodLabel?: string;

  @ApiPropertyOptional({
    enum: MindmapTemplateType,
    default: MindmapTemplateType.SPIDER,
  })
  @IsOptional()
  @IsEnum(MindmapTemplateType)
  template?: MindmapTemplateType;

  @ApiPropertyOptional({ description: 'Đồ thị dựng sẵn' })
  @IsOptional()
  @IsObject()
  @MaxJsonBytes(MINDMAP_LIMITS.MAX_GRAPH_BYTES)
  graph?: Record<string, unknown>;
}

export class UpdateMindmapDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MINDMAP_LIMITS.MAX_TITLE_LENGTH)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(MINDMAP_LIMITS.MAX_PERIOD_LENGTH)
  periodLabel?: string | null;

  @ApiPropertyOptional({ enum: MindmapTemplateType })
  @IsOptional()
  @IsEnum(MindmapTemplateType)
  template?: MindmapTemplateType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @MaxJsonBytes(MINDMAP_LIMITS.MAX_GRAPH_BYTES)
  graph?: Record<string, unknown>;
}
