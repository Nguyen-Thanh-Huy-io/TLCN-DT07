import { Module } from '@nestjs/common';
import { HistoricalStatementController } from './historical-statement.controller';
import { HistoricalStatementService } from './historical-statement.service';
import { StatementValidationEngine } from './validation/statement-validation.engine';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

@Module({
  controllers: [HistoricalStatementController],
  providers: [
    HistoricalStatementService,
    StatementValidationEngine,
    PrismaService,
    RedisService,
  ],
  exports: [HistoricalStatementService, StatementValidationEngine],
})
export class HistoricalStatementModule {}
