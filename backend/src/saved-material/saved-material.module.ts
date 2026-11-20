import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { SavedMaterialController } from './saved-material.controller';
import { SavedMaterialService } from './saved-material.service';

// RedisService + PrismaService are listed because AuthGuard depends on them.
@Module({
  controllers: [SavedMaterialController],
  providers: [PrismaService, RedisService, SavedMaterialService],
  exports: [SavedMaterialService],
})
export class SavedMaterialModule {}
