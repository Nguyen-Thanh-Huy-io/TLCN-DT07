import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { MindmapController } from './mindmap.controller';
import { MindmapService } from './mindmap.service';
import { MindmapTemplateRegistry } from './mindmap-template.strategy';

// RedisService + PrismaService are listed because AuthGuard depends on them.
@Module({
  controllers: [MindmapController],
  providers: [
    MindmapService,
    MindmapTemplateRegistry,
    PrismaService,
    RedisService,
  ],
  exports: [MindmapService],
})
export class MindmapModule {}
