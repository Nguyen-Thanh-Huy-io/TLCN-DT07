import { Module } from '@nestjs/common';
import { PeriodController } from './period.controller';
import { PeriodService } from './period.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

@Module({
  controllers: [PeriodController],
  providers: [PeriodService, PrismaService, RedisService],
  exports: [PeriodService],
})
export class PeriodModule {}
