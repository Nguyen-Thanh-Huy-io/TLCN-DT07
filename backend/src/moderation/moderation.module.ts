import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BlogGatewayModule } from '../blog/blog-gateway.module';
import { RolesGuard } from '../common/access/roles.guard';
import { AuthGuard } from '../common/guards/auth.guard';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { NotificationModule } from '../notification/notification.module';
import { ModerationAiService } from './moderation-ai.service';
import { ModerationController } from './moderation.controller';
import { ModerationProcessor } from './moderation.processor';
import { ModerationService } from './moderation.service';

@Module({
  imports: [
    NotificationModule,
    BlogGatewayModule,
    BullModule.registerQueue({
      name: 'moderation-queue',
    }),
  ],
  controllers: [ModerationController],
  providers: [
    ModerationService,
    ModerationAiService,
    ModerationProcessor,
    PrismaService,
    RedisService,
    AuthGuard,
    RolesGuard,
  ],
  exports: [ModerationService, ModerationAiService],
})
export class ModerationModule {}
