import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class DeleteCommentDto {
  @IsOptional()
  @IsUUID()
  authorId?: string;
}

export class LikeCommentDto {
  @IsOptional()
  @IsUUID()
  userId?: string;
}
