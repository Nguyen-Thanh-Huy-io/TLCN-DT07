import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { PublicArticleSummary } from '../public-content.mapper';

export enum ArticleCatalogSortEnum {
  FEATURED = 'featured',
  YEAR_ASC = 'year-asc',
  YEAR_DESC = 'year-desc',
  NAME = 'name',
}

export const ARTICLE_CATALOG_LIMITS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 24,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  MAX_CSV_VALUES: 200,
  MAX_FACET_TAGS: 60,
  MAX_ARTICLE_IDS_LOOKUP: 500,
} as const;

export class PublicArticleCatalogQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: ARTICLE_CATALOG_LIMITS.DEFAULT_PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    minimum: ARTICLE_CATALOG_LIMITS.MIN_LIMIT,
    maximum: ARTICLE_CATALOG_LIMITS.MAX_LIMIT,
    default: ARTICLE_CATALOG_LIMITS.DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(ARTICLE_CATALOG_LIMITS.MIN_LIMIT)
  @Max(ARTICLE_CATALOG_LIMITS.MAX_LIMIT)
  limit?: number;

  @ApiPropertyOptional({
    enum: ArticleCatalogSortEnum,
    default: ArticleCatalogSortEnum.FEATURED,
  })
  @IsOptional()
  @IsEnum(ArticleCatalogSortEnum)
  sort?: ArticleCatalogSortEnum;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm tiêu đề, tóm tắt, năm, thẻ',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID chuyên mục (phân tách bằng dấu phẩy)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  categoryIds?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID chủ đề (phân tách bằng dấu phẩy)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  topicIds?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID hoặc tên thẻ Tag (phân tách bằng dấu phẩy)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  tags?: string;
}

export interface ArticleCatalogTagFacetDto {
  id: string;
  name: string;
  count: number;
}

export interface PublicArticleCatalogResponseDto {
  items: PublicArticleSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: {
    categoryCounts: Record<string, number>;
    topicCounts: Record<string, number>;
    tags: ArticleCatalogTagFacetDto[];
  };
}
