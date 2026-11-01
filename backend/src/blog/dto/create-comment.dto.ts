import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Bài viết rất hay, cảm ơn bạn đã chia sẻ!', description: 'Nội dung bình luận' })
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  @IsString({ message: 'content phải là chuỗi' })
  content: string;

  @ApiPropertyOptional({ example: 'comment-parent-id', description: 'ID comment cha để reply (tùy chọn)' })
  @IsOptional()
  @IsString({ message: 'parentId phải là chuỗi' })
  parentId?: string;
}
