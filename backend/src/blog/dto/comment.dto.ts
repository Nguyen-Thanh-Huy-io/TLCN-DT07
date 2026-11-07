import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  authorId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsUUID()
  authorId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class DeleteCommentDto {
  @IsUUID()
  authorId: string;
}

export class LikeCommentDto {
  @IsUUID()
  userId: string;
}
