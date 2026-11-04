import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  StatementRank,
  StatementValueType,
  VerificationStatus,
} from '@prisma/client';

export class CreateStatementReferenceInputDto {
  @ApiProperty({ description: 'ID tài liệu tham khảo (HistoricalReference ID)' })
  @IsString()
  @IsNotEmpty()
  referenceId: string;

  @ApiPropertyOptional({ description: 'Số trang hoặc khoảng trang (VD: "tr. 45-48")' })
  @IsOptional()
  @IsString()
  pageNumber?: string;

  @ApiPropertyOptional({ description: 'Chương / Phần của tài liệu' })
  @IsOptional()
  @IsString()
  chapter?: string;

  @ApiPropertyOptional({ description: 'Đoạn trích dẫn nguyên văn' })
  @IsOptional()
  @IsString()
  quote?: string;

  @ApiPropertyOptional({ description: 'Ghi chú thêm về trích dẫn' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateHistoricalStatementDto {
  @ApiProperty({
    description:
      'ID của thực thể chủ thể (HistoricalEntity ID — Event cũng là 1 HistoricalEntity, type=EVENT)',
    example: 'clx...entity-id',
  })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({
    description: 'ID của mối quan hệ (TaxonomyTerm ID)',
    example: 'clx...predicate-id',
  })
  @IsString()
  @IsNotEmpty()
  predicateId: string;

  @ApiPropertyOptional({
    description:
      'ID của thực thể đối tượng (HistoricalEntity ID — Event cũng là 1 HistoricalEntity, type=EVENT)',
    example: 'clx...target-entity-id',
  })
  @IsOptional()
  @IsString()
  objectId?: string;

  @ApiPropertyOptional({
    description: 'Giá trị hằng số (Literal Value) nếu quan hệ trỏ đến thuộc tính',
    example: 1442,
  })
  @IsOptional()
  objectValue?: any;

  @ApiPropertyOptional({
    description: 'Kiểu dữ liệu của objectValue',
    enum: StatementValueType,
    example: StatementValueType.NUMBER,
  })
  @IsOptional()
  @IsEnum(StatementValueType)
  objectValueType?: StatementValueType;

  @ApiPropertyOptional({
    description: 'Năm bắt đầu có hiệu lực (Số âm là TCN: -1 = 1 TCN, không có năm 0)',
    example: 1418,
  })
  @IsOptional()
  @IsInt()
  validFromYear?: number;

  @ApiPropertyOptional({
    description: 'Năm kết thúc có hiệu lực (Số âm là TCN: -1 = 1 TCN, không có năm 0)',
    example: 1427,
  })
  @IsOptional()
  @IsInt()
  validToYear?: number;

  @ApiPropertyOptional({
    description: 'Thứ tự hiển thị ưu tiên',
    default: 0,
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number = 0;

  @ApiPropertyOptional({
    description: 'Có phải là mối quan hệ chính hay không',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;

  @ApiPropertyOptional({
    description: 'Thông tin bổ trợ (Qualifiers) dạng JSONB (VD: { roleCode: "COMMANDER", notes: "..." })',
  })
  @IsOptional()
  @IsObject()
  qualifiers?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Trạng thái xác minh',
    enum: VerificationStatus,
    default: VerificationStatus.VERIFIED,
  })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus = VerificationStatus.VERIFIED;

  @ApiPropertyOptional({
    description: 'Mức xếp hạng ưu tiên của quan hệ',
    enum: StatementRank,
    default: StatementRank.NORMAL,
  })
  @IsOptional()
  @IsEnum(StatementRank)
  rank?: StatementRank = StatementRank.NORMAL;

  @ApiPropertyOptional({
    description: 'Danh sách trích dẫn nguồn sách / tài liệu tham khảo kèm theo',
    type: [CreateStatementReferenceInputDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateStatementReferenceInputDto)
  references?: CreateStatementReferenceInputDto[];
}
