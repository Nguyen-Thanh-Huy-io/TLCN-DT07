import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { PublicContentController } from './public-content.controller';
import { PublicContentService } from './public-content.service';
import { PublicQuizService } from './public-quiz.service';
import { PublicTimelineService } from './public-timeline.service';
import { ArticleAdjacencyService } from './article-adjacency.service';

@Module({
  controllers: [PublicContentController],
  providers: [
    PublicContentService,
    PublicTimelineService,
    PublicQuizService,
    ArticleAdjacencyService,
    PrismaService,
  ],
})
export class PublicContentModule {}
