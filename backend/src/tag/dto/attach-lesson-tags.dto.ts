import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AttachLessonTagsDto {
  @ApiProperty({
    example: [
      'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
      'f9e8d7c6-b5a4-3210-fedc-0987654321ba',
    ],
    description: 'Danh sách Tag IDs cần gán cho bài học',
    type: [String],
  })
  @IsArray({ message: 'tagIds phải là một mảng' })
  @ArrayNotEmpty({ message: 'Danh sách tagIds không được để trống' })
  @IsUUID('4', {
    each: true,
    message: 'Mỗi tagId trong danh sách phải là UUID hợp lệ',
  })
  tagIds: string[];
}
