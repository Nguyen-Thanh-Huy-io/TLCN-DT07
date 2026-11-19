import { NotFoundException } from '@nestjs/common';
import { FlashcardRating } from './flashcard.constant';
import { FlashcardService } from './flashcard.service';
import { Sm2Scheduler } from './sm2.scheduler';

describe('FlashcardService', () => {
  let service: FlashcardService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      flashcardDeck: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      flashcard: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        groupBy: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new FlashcardService(mockPrisma, new Sm2Scheduler());
  });

  it('listDecks trả danh sách kèm tổng thẻ và số thẻ đến hạn', async () => {
    mockPrisma.flashcardDeck.findMany.mockResolvedValue([
      {
        id: 'deck-1',
        title: 'Triều Trần',
        description: null,
        _count: { cards: 5 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mockPrisma.flashcard.groupBy.mockResolvedValue([
      { deckId: 'deck-1', _count: { _all: 2 } },
    ]);

    const decks = await service.listDecks('user-1');
    expect(decks).toHaveLength(1);
    expect(decks[0].totalCards).toBe(5);
    expect(decks[0].dueCards).toBe(2);
  });

  it('createCard báo NotFoundException nếu deck không thuộc owner', async () => {
    mockPrisma.flashcardDeck.findFirst.mockResolvedValue(null);
    await expect(
      service.createCard('user-1', 'deck-x', { front: 'Q', back: 'A' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('reviewCard cập nhật trạng thái SM-2 và lastReviewedAt', async () => {
    mockPrisma.flashcard.findFirst.mockResolvedValue({
      id: 'card-1',
      ownerId: 'user-1',
      repetitions: 0,
      intervalDays: 0,
      easeFactor: 2.5,
    });
    mockPrisma.flashcard.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'card-1', ...data }),
    );

    const updated = await service.reviewCard(
      'user-1',
      'card-1',
      FlashcardRating.GOOD,
    );
    expect(updated.repetitions).toBe(1);
    expect(updated.intervalDays).toBe(1);
    expect(updated.lastReviewedAt).toBeInstanceOf(Date);
  });
});
