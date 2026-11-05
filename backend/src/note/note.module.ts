import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import {
  ArticleNoteStrategy,
  LessonNoteStrategy,
  NoteStrategyRegistry,
} from './strategies/note-target.strategy';

@Module({
  controllers: [NoteController],
  providers: [
    NoteService,
    ArticleNoteStrategy,
    LessonNoteStrategy,
    NoteStrategyRegistry,
    PrismaService,
  ],
  exports: [NoteService, NoteStrategyRegistry],
})
export class NoteModule {}
