import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
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
import { Type } from 'class-transformer';
import { ContentStatus, DifficultyLevel, HistoricalField, HistoricalGenre, LessonRelationType, MediaType } from '@prisma/client';
import { CreateQuestionDto } from '../../quiz/dto/create-question.dto';
import { QUIZ_CONSTANTS } from '../../quiz/constants/quiz.constant';

export class AssignLessonLocationDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID địa điểm lịch sử (UUID)',
  })
  @IsUUID('4')
  @IsNotEmpty()
  locationId: string;

  @ApiPropertyOptional({
    example: 'Nơi tập kết quân thủy',
    description: 'Vai trò của địa điểm trong bài học',
  })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự trạm dừng trong hành trình bài học',
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  stepOrder?: number = 0;
}

export class AssignLessonEntityDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID thực thể/nhân vật lịch sử (UUID)',
  })
  @IsUUID('4')
  @IsNotEmpty()
  entityId: string;

  @ApiPropertyOptional({
    example: 'Chủ soái lãnh đạo trận đánh',
    description: 'Vai trò của thực thể trong bài học',
  })
  @IsString()
  @IsOptional()
  role?: string;
}

export class AssignRelatedLessonDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID bài học mục tiêu liên kết (UUID)',
  })
  @IsUUID('4')
  @IsNotEmpty()
  targetLessonId: string;

  @ApiPropertyOptional({
    enum: LessonRelationType,
    example: LessonRelationType.CAUSE_EFFECT,
    description: 'Kiểu quan hệ (PREREQUISITE, CAUSE_EFFECT, COMPARISON, SYNCHRONOUS)',
    default: LessonRelationType.COMPARISON,
  })
  @IsEnum(LessonRelationType)
  @IsOptional()
  relationType?: LessonRelationType = LessonRelationType.COMPARISON;
}

export class CreateLessonMediaDto {
  @ApiPropertyOptional({
    enum: MediaType,
    example: MediaType.IMAGE,
    description: 'Loại media (IMAGE, VIDEO, AUDIO, DOCUMENT, MODEL_3D)',
    default: MediaType.IMAGE,
  })
  @IsEnum(MediaType)
  @IsOptional()
  type?: MediaType = MediaType.IMAGE;

  @ApiProperty({
    example: 'https://example.com/images/bach-dang-coc-go.jpg',
    description: 'Đường dẫn URL của file ảnh/video/tài liệu',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'URL media không được để trống' })
  @MaxLength(500)
  url: string;

  @ApiPropertyOptional({
    example: 'Trận địa cọc gỗ trên sông Bạch Đằng năm 938',
    description: 'Chú thích hình ảnh/video',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  caption?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự hiển thị media',
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number = 0;
}

export class CreateLessonDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID của Chủ đề lịch sử (Topic) chứa bài học này (UUID)',
  })
  @IsUUID('4', { message: 'topicId phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'topicId không được để trống' })
  topicId: string;

  @ApiProperty({
    example: 'Chiến thắng Bạch Đằng năm 938',
    description: 'Tiêu đề bài học lịch sử',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề bài học không được để trống' })
  @MaxLength(255)
  title: string;

  @ApiProperty({
    enum: HistoricalGenre,
    example: HistoricalGenre.DOCUMENTED_HISTORY,
    description: 'Thể loại sử học (DOCUMENTED_HISTORY, FOLKLORE_MYTHOLOGY, ORAL_HISTORY, ARCHAEOLOGICAL_EVIDENCE)',
    default: HistoricalGenre.DOCUMENTED_HISTORY,
  })
  @IsEnum(HistoricalGenre, { message: 'genre phải là giá trị hợp lệ của HistoricalGenre' })
  @IsNotEmpty({ message: 'Thể loại sử học (genre) không được để trống' })
  genre: HistoricalGenre = HistoricalGenre.DOCUMENTED_HISTORY;

  @ApiProperty({
    enum: HistoricalField,
    isArray: true,
    example: [HistoricalField.MILITARY_WAR, HistoricalField.POLITICAL_DIPLOMACY],
    description: 'Lĩnh vực lịch sử (chính trị, quân sự, văn hóa, kinh tế...)',
  })
  @IsArray({ message: 'fields phải là một mảng' })
  @IsEnum(HistoricalField, { each: true, message: 'Mỗi field phải là giá trị hợp lệ của HistoricalField' })
  fields: HistoricalField[];

  @ApiPropertyOptional({
    example: 938,
    description: 'Năm bắt đầu (Số nguyên, có thể âm)',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  startYear?: number;

  @ApiPropertyOptional({
    example: 938,
    description: 'Năm kết thúc (Số nguyên, có thể âm)',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  endYear?: number;

  @ApiPropertyOptional({
    example: 'Năm 938 (Mùa đông)',
    description: 'Chuỗi hiển thị niên đại linh hoạt',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  dateDisplay?: string;

  @ApiPropertyOptional({
    example: '<p>Năm 938, Ngô Quyền đã dùng trận địa cọc gỗ cắm trên sông Bạch Đằng...</p>',
    description: 'Nội dung bài học dạng Rich Text / HTML / Markdown',
  })
  @IsString()
  @IsOptional()
  contentRichText?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/bach-dang.jpg',
    description: 'URL ảnh xem trước / thumbnail bài học',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    enum: DifficultyLevel,
    example: DifficultyLevel.MEDIUM,
    description: 'Độ khó bài học (EASY, MEDIUM, HARD)',
    default: DifficultyLevel.MEDIUM,
  })
  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel = DifficultyLevel.MEDIUM;

  @ApiPropertyOptional({
    example: 'Đại Việt Sử Ký Toàn Thư, Tập 1, NXB Khoa Học Xã Hội',
    description: 'Trích dẫn nguồn tư liệu lịch sử tham khảo',
  })
  @IsString()
  @IsOptional()
  sourceReferenceNote?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự hiển thị bài học trong Topic',
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number = 0;

  @ApiPropertyOptional({
    enum: ContentStatus,
    example: ContentStatus.DRAFT,
    description: 'Trạng thái phát hành (DRAFT, PENDING_REVIEW, PUBLISHED...)',
    default: ContentStatus.DRAFT,
  })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus = ContentStatus.DRAFT;

  @ApiPropertyOptional({
    type: [CreateLessonMediaDto],
    description: 'Danh sách các ảnh/video minh họa kèm theo bài học',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonMediaDto)
  media?: CreateLessonMediaDto[];

  @ApiPropertyOptional({
    type: [AssignLessonLocationDto],
    description: 'Danh sách các địa điểm/di tích gắn với bài học (có vai trò, thứ tự trạm)',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AssignLessonLocationDto)
  locations?: AssignLessonLocationDto[];

  @ApiPropertyOptional({
    type: [AssignLessonEntityDto],
    description: 'Danh sách các nhân vật / thực thể gắn với bài học (kèm vai trò)',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AssignLessonEntityDto)
  entities?: AssignLessonEntityDto[];

  @ApiPropertyOptional({
    type: [AssignRelatedLessonDto],
    description: 'Mạng lưới bài học liên quan (tiền đề, nhân quả, so sánh)',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AssignRelatedLessonDto)
  relatedLessons?: AssignRelatedLessonDto[];

  @ApiPropertyOptional({
    description:
      'Quiz đính kèm bài học (tuỳ chọn). Nếu cung cấp, quiz sẽ được tạo cùng bài học trong một transaction.',
    type: () => EmbeddedQuizDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmbeddedQuizDto)
  quiz?: EmbeddedQuizDto;
}

/**
 * DTO nhúng Quiz khi tạo Lesson (không có lessonId/topicId — sẽ được auto-inject từ Lesson).
 * Dùng riêng để tránh circular dependency với CreateQuizDto.
 */
export class EmbeddedQuizDto {
  @ApiProperty({
    example: 'Trắc nghiệm củng cố: Chiến thắng Bạch Đằng',
    description: 'Tiêu đề bài kiểm tra',
  })
  @IsString({ message: 'Tiêu đề bài kiểm tra phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề bài kiểm tra không được để trống' })
  title: string;

  @ApiPropertyOptional({
    example: 'Bài kiểm tra 10 câu về trận Bạch Đằng năm 938.',
    description: 'Mô tả bài kiểm tra',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiPropertyOptional({
    example: 70,
    description: 'Phần trăm điểm để vượt qua (0-100)',
    default: QUIZ_CONSTANTS.DEFAULT_PASSING_SCORE,
  })
  @IsOptional()
  @IsInt({ message: 'passingScore phải là số nguyên' })
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'Giới hạn thời gian làm bài (phút). Bỏ trống nếu không giới hạn',
  })
  @IsOptional()
  @IsInt({ message: 'timeLimitMinutes phải là số nguyên' })
  @Min(1)
  timeLimitMinutes?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Điểm XP nhận được khi vượt qua bài kiểm tra',
    default: QUIZ_CONSTANTS.DEFAULT_XP_REWARD,
  })
  @IsOptional()
  @IsInt({ message: 'xpReward phải là số nguyên' })
  @Min(0)
  xpReward?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Số lần làm bài tối đa. Bỏ trống nếu không giới hạn',
  })
  @IsOptional()
  @IsInt({ message: 'maxAttempts phải là số nguyên' })
  @Min(1)
  maxAttempts?: number;

  @ApiPropertyOptional({
    type: [CreateQuestionDto],
    description: 'Danh sách câu hỏi kèm theo Quiz',
  })
  @IsOptional()
  @IsArray({ message: 'questions phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}
