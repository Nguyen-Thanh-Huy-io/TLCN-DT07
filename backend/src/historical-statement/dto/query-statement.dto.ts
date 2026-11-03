import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  StatementRank,
  StatementValueType,
  VerificationStatus,
} from '@prisma/client';
import { STATEMENT_CONSTANTS } from '../historical-statement.constant';

export class QueryHistoricalStatementDto {
  @ApiPropertyOptional({
    description: 'Số trang',
    default: STATEMENT_CONSTANTS.DEFAULT_PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = STATEMENT_CONSTANTS.DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: 'Số mục mỗi trang',
    default: STATEMENT_CONSTANTS.DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(STATEMENT_CONSTANTS.MAX_LIMIT)
  limit?: number = STATEMENT_CONSTANTS.DEFAULT_LIMIT;

  @ApiPropertyOptional({ description: 'Lọc theo Subject (HistoricalEntity ID)' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo Object (HistoricalEntity ID)' })
  @IsOptional()
  @IsString()
  objectId?: string;

  @ApiPropertyOptional({
    description: 'Lọc tất cả các quan hệ liên quan đến một Node (dù là Subject hay Object)',
  })
  @IsOptional()
  @IsString()
  nodeId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID loại quan hệ (TaxonomyTerm ID)' })
  @IsOptional()
  @IsString()
  predicateId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo mã loại quan hệ (TaxonomyTerm Code)' })
  @IsOptional()
  @IsString()
  predicateCode?: string;

  @ApiPropertyOptional({ description: 'Lọc theo trạng thái xác minh', enum: VerificationStatus })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({ description: 'Lọc theo mức xếp hạng', enum: StatementRank })
  @IsOptional()
  @IsEnum(StatementRank)
  rank?: StatementRank;

  @ApiPropertyOptional({ description: 'Chỉ lấy các quan hệ chính (isPrimary = true)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Năm diễn ra cần lọc (nằm trong khoảng validFromYear và validToYear)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;
}
