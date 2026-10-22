import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

// PrismaService + RedisService are required by AuthGuard/ContentWriteGuard on the upload endpoints.
@Module({
  controllers: [UploadController],
  providers: [PrismaService, RedisService],
})
export class UploadModule {}
