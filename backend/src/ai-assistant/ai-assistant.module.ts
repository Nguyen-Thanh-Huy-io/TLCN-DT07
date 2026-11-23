import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';

@Module({
  controllers: [AiAssistantController],
  providers: [AiAssistantService, PrismaService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
