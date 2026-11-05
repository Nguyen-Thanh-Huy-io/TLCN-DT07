import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { PublicContentController } from './public-content.controller';
import { PublicContentService } from './public-content.service';

@Module({
  controllers: [PublicContentController],
  providers: [PublicContentService, PrismaService],
})
export class PublicContentModule {}
