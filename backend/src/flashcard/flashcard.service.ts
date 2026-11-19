import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import {
  CreateCardDto,
  CreateDeckBatchDto,
  CreateDeckDto,
  UpdateCardDto,
  UpdateDeckDto,
} from './dto/flashcard.dto';
import {
  FLASHCARD_LIMITS,
  FLASHCARD_MESSAGES,
  FlashcardRating,
} from './flashcard.constant';
import { Sm2Scheduler } from './sm2.scheduler';

export interface FlashcardDeckSummary {
  id: string;
  title: string;
  description: string | null;
  totalCards: number;
  dueCards: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FlashcardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduler: Sm2Scheduler,
  ) {}

  async listDecks(ownerId: string): Promise<FlashcardDeckSummary[]> {
    const now = new Date();
    const decks = await this.prisma.flashcardDeck.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { cards: true } } },
    });

    if (decks.length === 0) return [];

    const dueCounts = await this.prisma.flashcard.groupBy({
      by: ['deckId'],
      where: {
        ownerId,
        deckId: { in: decks.map((d) => d.id) },
        nextReviewAt: { lte: now },
      },
      _count: { _all: true },
    });
    const dueMap = new Map(dueCounts.map((r) => [r.deckId, r._count._all]));

    return decks.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      totalCards: d._count.cards,
      dueCards: dueMap.get(d.id) ?? 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  }

  async createDeck(ownerId: string, dto: CreateDeckDto) {
    const count = await this.prisma.flashcardDeck.count({ where: { ownerId } });
    if (count >= FLASHCARD_LIMITS.MAX_DECKS_PER_USER) {
      throw new BadRequestException(FLASHCARD_MESSAGES.TOO_MANY_DECKS);
    }
    return this.prisma.flashcardDeck.create({
      data: {
        ownerId,
        title: dto.title,
        description: dto.description ?? null,
      },
    });
  }

  async createDeckBatch(ownerId: string, dto: CreateDeckBatchDto) {
    const count = await this.prisma.flashcardDeck.count({ where: { ownerId } });
    if (count >= FLASHCARD_LIMITS.MAX_DECKS_PER_USER) {
      throw new BadRequestException(FLASHCARD_MESSAGES.TOO_MANY_DECKS);
    }
    return this.prisma.$transaction(async (tx) => {
      const deck = await tx.flashcardDeck.create({
        data: {
          ownerId,
          title: dto.title,
          description: dto.description ?? null,
        },
      });
      await tx.flashcard.createMany({
        data: dto.cards.map((card) => ({
          deckId: deck.id,
          ownerId,
          front: card.front,
          back: card.back,
          sourceNoteId: card.sourceNoteId ?? null,
        })),
      });
      return { ...deck, totalCards: dto.cards.length, dueCards: dto.cards.length };
    });
  }

  async updateDeck(ownerId: string, deckId: string, dto: UpdateDeckDto) {
    await this.assertDeckOwned(ownerId, deckId);
    return this.prisma.flashcardDeck.update({
      where: { id: deckId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
      },
    });
  }

  async deleteDeck(ownerId: string, deckId: string) {
    await this.assertDeckOwned(ownerId, deckId);
    await this.prisma.flashcardDeck.delete({ where: { id: deckId } });
    return { deleted: true };
  }

  async listCards(ownerId: string, deckId: string) {
    await this.assertDeckOwned(ownerId, deckId);
    return this.prisma.flashcard.findMany({
      where: { ownerId, deckId },
      orderBy: [{ nextReviewAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async listDueCards(ownerId: string, deckId: string) {
    await this.assertDeckOwned(ownerId, deckId);
    return this.prisma.flashcard.findMany({
      where: {
        ownerId,
        deckId,
        nextReviewAt: { lte: new Date() },
      },
      orderBy: [{ nextReviewAt: 'asc' }, { createdAt: 'asc' }],
      take: FLASHCARD_LIMITS.DUE_BATCH_LIMIT,
    });
  }

  async createCard(ownerId: string, deckId: string, dto: CreateCardDto) {
    await this.assertDeckOwned(ownerId, deckId);
    const count = await this.prisma.flashcard.count({ where: { deckId } });
    if (count >= FLASHCARD_LIMITS.MAX_CARDS_PER_DECK) {
      throw new BadRequestException(FLASHCARD_MESSAGES.TOO_MANY_CARDS);
    }
    return this.prisma.flashcard.create({
      data: {
        deckId,
        ownerId,
        front: dto.front,
        back: dto.back,
        sourceNoteId: dto.sourceNoteId ?? null,
      },
    });
  }

  async updateCard(ownerId: string, cardId: string, dto: UpdateCardDto) {
    await this.assertCardOwned(ownerId, cardId);
    return this.prisma.flashcard.update({
      where: { id: cardId },
      data: {
        ...(dto.front !== undefined ? { front: dto.front } : {}),
        ...(dto.back !== undefined ? { back: dto.back } : {}),
      },
    });
  }

  async deleteCard(ownerId: string, cardId: string) {
    await this.assertCardOwned(ownerId, cardId);
    await this.prisma.flashcard.delete({ where: { id: cardId } });
    return { deleted: true };
  }

  async reviewCard(ownerId: string, cardId: string, rating: FlashcardRating) {
    const card = await this.assertCardOwned(ownerId, cardId);
    const now = new Date();
    const next = this.scheduler.schedule(
      {
        repetitions: card.repetitions,
        intervalDays: card.intervalDays,
        easeFactor: card.easeFactor,
      },
      rating,
      now,
    );

    return this.prisma.flashcard.update({
      where: { id: cardId },
      data: {
        repetitions: next.repetitions,
        intervalDays: next.intervalDays,
        easeFactor: next.easeFactor,
        nextReviewAt: next.nextReviewAt,
        lastReviewedAt: now,
      },
    });
  }

  private async assertDeckOwned(ownerId: string, deckId: string) {
    const deck = await this.prisma.flashcardDeck.findFirst({
      where: { id: deckId, ownerId },
      select: { id: true },
    });
    if (!deck) throw new NotFoundException(FLASHCARD_MESSAGES.DECK_NOT_FOUND);
    return deck;
  }

  private async assertCardOwned(ownerId: string, cardId: string) {
    const card = await this.prisma.flashcard.findFirst({
      where: { id: cardId, ownerId },
    });
    if (!card) throw new NotFoundException(FLASHCARD_MESSAGES.CARD_NOT_FOUND);
    return card;
  }
}
