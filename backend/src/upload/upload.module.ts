import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

// PrismaService + RedisService are required by AuthGuard/ContentWriteGuard on the upload endpoints.
@Module({
  controllers: [UploadController],
  providers: [UploadService, PrismaService, RedisService],
  exports: [UploadService],
})
export class UploadModule {}
