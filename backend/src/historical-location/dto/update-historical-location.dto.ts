import { PartialType } from '@nestjs/swagger';
import { CreateHistoricalLocationDto } from './create-historical-location.dto';

export class UpdateHistoricalLocationDto extends PartialType(CreateHistoricalLocationDto) {}
