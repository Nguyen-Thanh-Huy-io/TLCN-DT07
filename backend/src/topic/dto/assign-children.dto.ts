import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AssignChildrenDto {
  @ApiProperty({
    example: [
      'b95ffe80-65c0-417d-8cb5-b5c6b62a065b',
      'c0a80123-0000-0000-0000-000000000011',
    ],
    description: 'Danh sách UUID các chủ đề con cần gắn vào chủ đề cha hiện tại',
    type: [String],
  })
  @IsArray({ message: 'childIds phải là một mảng danh sách các UUID' })
  @ArrayNotEmpty({ message: 'Danh sách childIds không được để trống' })
  @IsUUID('4', { each: true, message: 'Mỗi phần tử trong childIds phải là UUID hợp lệ' })
  childIds: string[];
}
