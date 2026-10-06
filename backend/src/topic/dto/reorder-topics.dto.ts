import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderTopicItemDto {
  @ApiProperty({
    example: '8e8ec204-75f5-4574-bf55-8aee52a4e145',
    description: 'UUID của chủ đề cần sắp xếp',
  })
  @IsUUID('4', { message: 'id phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'id không được để trống' })
  id: string;

  @ApiProperty({
    example: 1,
    description: 'Thứ tự hiển thị mới (displayOrder)',
    minimum: 0,
  })
  @IsInt({ message: 'displayOrder phải là số nguyên' })
  @Min(0, { message: 'displayOrder không được nhỏ hơn 0' })
  displayOrder: number;
}

export class ReorderTopicsDto {
  @ApiProperty({
    type: [ReorderTopicItemDto],
    description: 'Danh sách các chủ đề cùng thứ tự hiển thị mới',
  })
  @IsArray({ message: 'items phải là một mảng' })
  @ArrayNotEmpty({ message: 'items không được để trống' })
  @ValidateNested({ each: true })
  @Type(() => ReorderTopicItemDto)
  items: ReorderTopicItemDto[];
}
