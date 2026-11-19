import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import {
  ArticleNoteStrategy,
  LessonNoteStrategy,
  NoteStrategyRegistry,
} from './strategies/note-target.strategy';
import {
  BlockClusterAnchorStrategy,
  HeadingSectionAnchorStrategy,
  InkAnchorStrategy,
  InlineTextAnchorStrategy,
  NoteAnchorStrategyRegistry,
} from './strategies/note-anchor.strategy';

@Module({
  controllers: [NoteController],
  providers: [
    NoteService,
    ArticleNoteStrategy,
    LessonNoteStrategy,
    NoteStrategyRegistry,
    InlineTextAnchorStrategy,
    BlockClusterAnchorStrategy,
    HeadingSectionAnchorStrategy,
    InkAnchorStrategy,
    NoteAnchorStrategyRegistry,
    PrismaService,
  ],
  exports: [NoteService, NoteStrategyRegistry, NoteAnchorStrategyRegistry],
})
export class NoteModule {}
