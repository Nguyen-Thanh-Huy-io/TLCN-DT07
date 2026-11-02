import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  StatementRank,
  StatementValueType,
  VerificationStatus,
} from '@prisma/client';

export class StatementReferenceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  referenceId: string;

  @ApiProperty()
  referenceTitle: string;

  @ApiPropertyOptional()
  referenceAuthor?: string | null;

  @ApiPropertyOptional()
  pageNumber?: string | null;

  @ApiPropertyOptional()
  chapter?: string | null;

  @ApiPropertyOptional()
  quote?: string | null;

  @ApiPropertyOptional()
  note?: string | null;
}

export class HistoricalStatementResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  subjectEntityId?: string | null;

  @ApiPropertyOptional()
  subjectEntity?: {
    id: string;
    name: string;
    type: string;
    imageUrl?: string | null;
  } | null;

  @ApiPropertyOptional()
  subjectEventId?: string | null;

  @ApiPropertyOptional()
  subjectEvent?: {
    id: string;
    title: string;
    dateText?: string | null;
  } | null;

  @ApiProperty()
  predicateId: string;

  @ApiProperty()
  predicate: {
    id: string;
    code: string;
    label: string;
    inverseLabel?: string | null;
  };

  @ApiPropertyOptional()
  objectEntityId?: string | null;

  @ApiPropertyOptional()
  objectEntity?: {
    id: string;
    name: string;
    type: string;
    imageUrl?: string | null;
  } | null;

  @ApiPropertyOptional()
  objectEventId?: string | null;

  @ApiPropertyOptional()
  objectEvent?: {
    id: string;
    title: string;
    dateText?: string | null;
  } | null;

  @ApiPropertyOptional()
  objectValue?: any | null;

  @ApiPropertyOptional({ enum: StatementValueType })
  objectValueType?: StatementValueType | null;

  @ApiPropertyOptional()
  validFromYear?: number | null;

  @ApiPropertyOptional()
  validToYear?: number | null;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  isPrimary: boolean;

  @ApiPropertyOptional()
  qualifiers?: Record<string, any> | null;

  @ApiProperty({ enum: VerificationStatus })
  verificationStatus: VerificationStatus;

  @ApiProperty({ enum: StatementRank })
  rank: StatementRank;

  @ApiPropertyOptional({ type: [StatementReferenceResponseDto] })
  references?: StatementReferenceResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
