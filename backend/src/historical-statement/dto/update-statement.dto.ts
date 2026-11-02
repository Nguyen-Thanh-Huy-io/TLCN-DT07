import { PartialType } from '@nestjs/swagger';
import { CreateHistoricalStatementDto } from './create-statement.dto';

export class UpdateHistoricalStatementDto extends PartialType(
  CreateHistoricalStatementDto,
) {}
