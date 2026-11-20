import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { MODERATION_QUEUE } from './moderation.constant';
import { ModerationScanJobData, ModerationService } from './moderation.service';

@Injectable()
@Processor(MODERATION_QUEUE)
export class ModerationProcessor extends WorkerHost {
  constructor(private readonly moderationService: ModerationService) {
    super();
  }

  async process(job: Job<ModerationScanJobData>): Promise<void> {
    const { targetType, targetId } = job.data || {};
    if (!targetType || !targetId) {
      return;
    }

    await this.moderationService.scanTarget(targetType, targetId);
  }
}
