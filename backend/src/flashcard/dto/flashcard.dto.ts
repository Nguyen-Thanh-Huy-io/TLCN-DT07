import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
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

export class GenerateFlashcardsDto {
  @ApiPropertyOptional({
    description: 'Chủ đề lịch sử muốn AI tạo thẻ (kể cả khi chưa có ghi chú)',
    example: 'Khởi nghĩa Lam Sơn và Lê Lợi',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(FLASHCARD_LIMITS.MAX_TOPIC_HINT_LENGTH)
  topicHint?: string;

  @ApiPropertyOptional({
    description: 'Lấy ghi chú cá nhân của người học làm nguồn',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeNotes?: boolean;

  @ApiPropertyOptional({
    description: 'Bao gồm các câu hỏi người học từng trả lời sai trong Quiz',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeWrongQuizzes?: boolean;

  @ApiPropertyOptional({
    description: 'Danh sách ID bài viết đã lưu cần đưa vào ngữ cảnh',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(FLASHCARD_LIMITS.MAX_AI_ARTICLES)
  @IsUUID('4', { each: true })
  articleIds?: string[];

  @ApiPropertyOptional({
    description: 'Số lượng thẻ tối đa cần sinh',
    default: FLASHCARD_LIMITS.DEFAULT_AI_CARDS,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(FLASHCARD_LIMITS.MIN_AI_CARDS)
  @Max(FLASHCARD_LIMITS.MAX_AI_CARDS)
  maxCards?: number;
}

export class CreateDeckBatchDto {
  @ApiProperty({ example: 'Ôn tập Khởi nghĩa Lam Sơn' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(FLASHCARD_LIMITS.MAX_DECK_TITLE_LENGTH)
  title: string;

  @ApiPropertyOptional({ example: 'Tổng hợp bởi AI từ sổ tay và sử liệu' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(FLASHCARD_LIMITS.MAX_DECK_DESC_LENGTH)
  description?: string;

  @ApiProperty({ type: [CreateCardDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(FLASHCARD_LIMITS.MAX_CARDS_PER_DECK)
  @ValidateNested({ each: true })
  @Type(() => CreateCardDto)
  cards: CreateCardDto[];
}
