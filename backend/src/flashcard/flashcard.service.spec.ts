import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GamificationEventName } from '../gamification/gamification.constant';
import { FlashcardRating, FLASHCARD_LIMITS } from './flashcard.constant';
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
        createMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(mockPrisma)),
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

  it('listDecks trả mảng rỗng và bỏ qua groupBy khi không có bộ thẻ nào', async () => {
    mockPrisma.flashcardDeck.findMany.mockResolvedValue([]);

    const decks = await service.listDecks('user-1');

    expect(decks).toEqual([]);
    expect(mockPrisma.flashcard.groupBy).not.toHaveBeenCalled();
  });

  it('createDeck tạo bộ thẻ mới khi chưa đạt giới hạn', async () => {
    mockPrisma.flashcardDeck.count.mockResolvedValue(0);
    mockPrisma.flashcardDeck.create.mockResolvedValue({ id: 'deck-1' });

    const res = await service.createDeck('user-1', {
      title: 'Bộ thẻ mới',
    } as any);

    expect(mockPrisma.flashcardDeck.create).toHaveBeenCalledWith({
      data: { ownerId: 'user-1', title: 'Bộ thẻ mới', description: null },
    });
    expect(res).toEqual({ id: 'deck-1' });
  });

  it('createDeck báo BadRequestException khi đã đạt giới hạn số bộ thẻ', async () => {
    mockPrisma.flashcardDeck.count.mockResolvedValue(
      FLASHCARD_LIMITS.MAX_DECKS_PER_USER,
    );

    await expect(
      service.createDeck('user-1', { title: 'Thừa' } as any),
    ).rejects.toThrow(BadRequestException);
    expect(mockPrisma.flashcardDeck.create).not.toHaveBeenCalled();
  });

  it('updateDeck chỉ ghi trường có truyền và báo lỗi nếu không thuộc owner', async () => {
    mockPrisma.flashcardDeck.findFirst.mockResolvedValue({ id: 'deck-1' });
    await service.updateDeck('user-1', 'deck-1', { title: 'Tên mới' } as any);
    expect(mockPrisma.flashcardDeck.update).toHaveBeenCalledWith({
      where: { id: 'deck-1' },
      data: { title: 'Tên mới' },
    });

    mockPrisma.flashcardDeck.findFirst.mockResolvedValue(null);
    await expect(
      service.updateDeck('user-1', 'deck-x', { title: 'X' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('deleteDeck xoá bộ thẻ sau khi xác nhận quyền sở hữu', async () => {
    mockPrisma.flashcardDeck.findFirst.mockResolvedValue({ id: 'deck-1' });

    const res = await service.deleteDeck('user-1', 'deck-1');

    expect(mockPrisma.flashcardDeck.delete).toHaveBeenCalledWith({
      where: { id: 'deck-1' },
    });
    expect(res).toEqual({ deleted: true });
  });

  it('listCards/listDueCards báo NotFoundException nếu deck không thuộc owner', async () => {
    mockPrisma.flashcardDeck.findFirst.mockResolvedValue(null);
    await expect(service.listCards('user-1', 'deck-x')).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.listDueCards('user-1', 'deck-x')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('listDueCards chỉ lấy thẻ đến hạn, giới hạn DUE_BATCH_LIMIT', async () => {
    mockPrisma.flashcardDeck.findFirst.mockResolvedValue({ id: 'deck-1' });
    mockPrisma.flashcard.findMany.mockResolvedValue([{ id: 'card-1' }]);

    const res = await service.listDueCards('user-1', 'deck-1');

    expect(mockPrisma.flashcard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: FLASHCARD_LIMITS.DUE_BATCH_LIMIT }),
    );
    expect(res).toEqual([{ id: 'card-1' }]);
  });

  it('createCard báo BadRequestException khi deck đã đạt giới hạn số thẻ', async () => {
    mockPrisma.flashcardDeck.findFirst.mockResolvedValue({ id: 'deck-1' });
    mockPrisma.flashcard.count.mockResolvedValue(
      FLASHCARD_LIMITS.MAX_CARDS_PER_DECK,
    );

    await expect(
      service.createCard('user-1', 'deck-1', { front: 'Q', back: 'A' }),
    ).rejects.toThrow(BadRequestException);
    expect(mockPrisma.flashcard.create).not.toHaveBeenCalled();
  });

  it('updateCard/deleteCard báo NotFoundException nếu thẻ không thuộc owner', async () => {
    mockPrisma.flashcard.findFirst.mockResolvedValue(null);
    await expect(
      service.updateCard('user-1', 'card-x', { front: 'X' } as any),
    ).rejects.toThrow(NotFoundException);
    await expect(service.deleteCard('user-1', 'card-x')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updateCard ghi trường có truyền; deleteCard xoá thẻ', async () => {
    mockPrisma.flashcard.findFirst.mockResolvedValue({ id: 'card-1' });
    await service.updateCard('user-1', 'card-1', { back: 'Đáp án mới' } as any);
    expect(mockPrisma.flashcard.update).toHaveBeenCalledWith({
      where: { id: 'card-1' },
      data: { back: 'Đáp án mới' },
    });

    const res = await service.deleteCard('user-1', 'card-1');
    expect(mockPrisma.flashcard.delete).toHaveBeenCalledWith({
      where: { id: 'card-1' },
    });
    expect(res).toEqual({ deleted: true });
  });

  it('reviewCard bắn sự kiện gamification FLASHCARD_REVIEWED', async () => {
    const emit = jest.fn();
    service = new FlashcardService(mockPrisma, new Sm2Scheduler(), {
      emit,
    } as any);
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

    await service.reviewCard('user-1', 'card-1', FlashcardRating.EASY);

    expect(emit).toHaveBeenCalledWith(
      GamificationEventName.FLASHCARD_REVIEWED,
      { userId: 'user-1', cardId: 'card-1', rating: FlashcardRating.EASY },
    );
  });

  it('createDeckBatch tạo bộ thẻ và toàn bộ thẻ trong 1 transaction', async () => {
    mockPrisma.flashcardDeck.count.mockResolvedValue(0);
    mockPrisma.flashcardDeck.create.mockResolvedValue({
      id: 'deck-batch-1',
      title: 'Bộ thẻ AI',
      description: null,
    });
    mockPrisma.flashcard.createMany.mockResolvedValue({ count: 2 });

    const res = await service.createDeckBatch('user-1', {
      title: 'Bộ thẻ AI',
      cards: [
        { front: 'Q1', back: 'A1' },
        { front: 'Q2', back: 'A2' },
      ],
    });

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.flashcard.createMany).toHaveBeenCalled();
    expect(res.totalCards).toBe(2);
    expect(res.dueCards).toBe(2);
  });
});
