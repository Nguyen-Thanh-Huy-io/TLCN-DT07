import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { ConceptCanvasController } from './concept-canvas.controller';
import { ConceptCanvasService } from './concept-canvas.service';
import { MindmapAiService } from './mindmap-ai.service';
import { MindmapController } from './mindmap.controller';
import { MindmapService } from './mindmap.service';
import { MindmapTemplateRegistry } from './mindmap-template.strategy';

// RedisService + PrismaService are listed because AuthGuard depends on them.
@Module({
  controllers: [MindmapController, ConceptCanvasController],
  providers: [
    MindmapService,
    MindmapAiService,
    ConceptCanvasService,
    MindmapTemplateRegistry,
    PrismaService,
    RedisService,
  ],
  exports: [MindmapService, MindmapAiService, ConceptCanvasService],
})
export class MindmapModule {}
