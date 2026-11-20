import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BlogGatewayModule } from '../blog/blog-gateway.module';
import { RolesGuard } from '../common/access/roles.guard';
import { AuthGuard } from '../common/guards/auth.guard';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { NotificationModule } from '../notification/notification.module';
import { ModerationAiService } from './moderation-ai.service';
import { ModerationReportService } from './moderation-report.service';
import { ModerationResolutionService } from './moderation-resolution.service';
import { ModerationController } from './moderation.controller';
import { ModerationProcessor } from './moderation.processor';
import { MODERATION_QUEUE } from './moderation.constant';
import { ModerationService } from './moderation.service';

@Module({
  imports: [
    NotificationModule,
    BlogGatewayModule,
    BullModule.registerQueue({
      name: MODERATION_QUEUE,
    }),
  ],
  controllers: [ModerationController],
  providers: [
    ModerationService,
    ModerationReportService,
    ModerationResolutionService,
    ModerationAiService,
    ModerationProcessor,
    PrismaService,
    RedisService,
    AuthGuard,
    RolesGuard,
  ],
  exports: [
    ModerationService,
    ModerationReportService,
    ModerationResolutionService,
    ModerationAiService,
  ],
})
export class ModerationModule {}
