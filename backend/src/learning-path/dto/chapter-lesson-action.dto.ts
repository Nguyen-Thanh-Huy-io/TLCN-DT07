import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddLessonsToChapterDto {
  @ApiProperty({ description: 'Danh sách ID bài học từ thư viện muốn gom vào chương', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  lessonIds: string[];
}

export class ReorderItemDto {
  @ApiProperty({ description: 'ID bài học' })
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @ApiProperty({ description: 'Thứ tự mới trong chương', example: 1 })
  @IsInt()
  @Min(0)
  displayOrder: number;
}

export class ReorderChapterLessonsDto {
  @ApiProperty({ description: 'Danh sách thứ tự bài học mới sau khi kéo thả', type: [ReorderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
