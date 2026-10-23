import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { ContentRevisionController } from './content-revision.controller';
import { ContentRevisionInterceptor } from './content-revision.interceptor';
import { ContentRevisionService } from './content-revision.service';
import { RevisionTargets } from './revision-targets';

/**
 * Global: ContentWrite (guard + interceptor) dùng ở controller của nhiều module nội dung; service
 * nội dung được lấy lúc chạy qua ModuleRef nên không phát sinh vòng import.
 */
@Global()
@Module({
  controllers: [ContentRevisionController],
  providers: [ContentRevisionService, ContentRevisionInterceptor, RevisionTargets, PrismaService, RedisService],
  exports: [ContentRevisionService, ContentRevisionInterceptor],
})
export class ContentRevisionModule {}
