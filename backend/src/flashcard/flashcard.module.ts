import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { FlashcardAiService } from './flashcard-ai.service';
import { FlashcardController } from './flashcard.controller';
import { FlashcardService } from './flashcard.service';
import { Sm2Scheduler } from './sm2.scheduler';

// RedisService + PrismaService are listed because AuthGuard depends on them.
@Module({
  controllers: [FlashcardController],
  providers: [
    FlashcardService,
    FlashcardAiService,
    Sm2Scheduler,
    PrismaService,
    RedisService,
  ],
  exports: [FlashcardService],
})
export class FlashcardModule {}
