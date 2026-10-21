import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventRelationType, VerificationStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateEventRelationDto {
  @ApiProperty({
    description: 'ID của sự kiện đích (Target Event)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'targetEventId phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'targetEventId không được để trống' })
  targetEventId: string;

  @ApiProperty({
    description: 'Loại quan hệ ngữ nghĩa / nhân quả giữa hai sự kiện',
    enum: EventRelationType,
    example: EventRelationType.CAUSES,
  })
  @IsEnum(EventRelationType, { message: 'relationType không hợp lệ' })
  @IsNotEmpty({ message: 'relationType không được để trống' })
  relationType: EventRelationType;

  @ApiPropertyOptional({
    description: 'Giải thích, mô tả chi tiết mối quan hệ nhân quả',
    example: 'Chiến thắng Bạch Đằng đã trực tiếp đặt dấu chấm hết cho cuộc xâm lược lần thứ 3 của quân Nguyên Mông.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái xác minh học thuật của mối liên hệ này',
    enum: VerificationStatus,
    default: VerificationStatus.VERIFIED,
  })
  @IsOptional()
  @IsEnum(VerificationStatus, { message: 'status không hợp lệ' })
  status?: VerificationStatus;

  @ApiPropertyOptional({
    description: 'Nguồn tài liệu tham khảo, trích dẫn học thuật chứng minh cho quan hệ này',
    example: 'Đại Việt Sử Ký Toàn Thư, Quyển V',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'sourceReference không quá 500 ký tự' })
  sourceReference?: string;
}

export class EventRelationNodeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  slug?: string;

  @ApiPropertyOptional()
  startYear?: number;

  @ApiPropertyOptional()
  endYear?: number;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;
}

export class EventRelationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sourceEventId: string;

  @ApiProperty()
  targetEventId: string;

  @ApiProperty({ enum: EventRelationType })
  relationType: EventRelationType;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: VerificationStatus })
  status: VerificationStatus;

  @ApiPropertyOptional()
  sourceReference?: string;

  @ApiPropertyOptional({ type: () => EventRelationNodeDto })
  sourceEvent?: EventRelationNodeDto;

  @ApiPropertyOptional({ type: () => EventRelationNodeDto })
  targetEvent?: EventRelationNodeDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class EventGraphEdgeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  target: string;

  @ApiProperty({ enum: EventRelationType })
  relationType: EventRelationType;

  @ApiPropertyOptional()
  label?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: VerificationStatus })
  status: VerificationStatus;

  @ApiPropertyOptional()
  sourceReference?: string;
}

export class EventGraphResponseDto {
  @ApiProperty({ type: [EventRelationNodeDto] })
  nodes: EventRelationNodeDto[];

  @ApiProperty({ type: [EventGraphEdgeDto] })
  edges: EventGraphEdgeDto[];
}
