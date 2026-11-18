import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { PublicContentController } from './public-content.controller';
import { PublicContentService } from './public-content.service';
import { ArticleAdjacencyService } from './article-adjacency.service';

@Module({
  controllers: [PublicContentController],
  providers: [PublicContentService, ArticleAdjacencyService, PrismaService],
})
export class PublicContentModule {}
