import { ApiProperty } from '@nestjs/swagger';
import { SavedMaterialKind } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class ToggleSavedMaterialDto {
  @ApiProperty({ enum: SavedMaterialKind })
  @IsEnum(SavedMaterialKind)
  kind!: SavedMaterialKind;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  targetId!: string;
}
