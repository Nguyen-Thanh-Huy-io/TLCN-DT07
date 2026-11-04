import { PartialType } from '@nestjs/swagger';
import { CreateHistoricalReferenceDto } from './create-reference.dto';

export class UpdateHistoricalReferenceDto extends PartialType(
  CreateHistoricalReferenceDto,
) {}
