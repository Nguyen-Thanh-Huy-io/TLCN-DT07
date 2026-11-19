import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { FLASHCARD_LIMITS, FlashcardRating } from '../flashcard.constant';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateDeckDto {
  @ApiProperty({ example: 'Ôn tập Triều Lý – Trần' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(FLASHCARD_LIMITS.MAX_DECK_TITLE_LENGTH)
  title: string;

  @ApiPropertyOptional({ example: 'Các sự kiện và nhân vật trọng tâm' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(FLASHCARD_LIMITS.MAX_DECK_DESC_LENGTH)
  description?: string;
}

export class UpdateDeckDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(FLASHCARD_LIMITS.MAX_DECK_TITLE_LENGTH)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(FLASHCARD_LIMITS.MAX_DECK_DESC_LENGTH)
  description?: string | null;
}

export class CreateCardDto {
  @ApiProperty({ example: 'Chiến thắng Bạch Đằng năm 938 do ai lãnh đạo?' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(FLASHCARD_LIMITS.MAX_CARD_SIDE_LENGTH)
  front: string;

  @ApiProperty({ example: 'Ngô Quyền — mở ra thời kỳ độc lập tự chủ.' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(FLASHCARD_LIMITS.MAX_CARD_SIDE_LENGTH)
  back: string;

  @ApiPropertyOptional({ description: 'ID ghi chú gốc (nếu tạo từ ghi chú)' })
  @IsOptional()
  @IsUUID('4')
  sourceNoteId?: string;
}

export class UpdateCardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(FLASHCARD_LIMITS.MAX_CARD_SIDE_LENGTH)
  front?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(FLASHCARD_LIMITS.MAX_CARD_SIDE_LENGTH)
  back?: string;
}

export class ReviewCardDto {
  @ApiProperty({ enum: FlashcardRating })
  @IsEnum(FlashcardRating)
  rating: FlashcardRating;
}
