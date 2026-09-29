import { PartialType } from '@nestjs/swagger';
import { CreateHistoricalEntityDto } from './create-historical-entity.dto';

export class UpdateHistoricalEntityDto extends PartialType(CreateHistoricalEntityDto) {}
