import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthGuard } from '../common/guards/auth.guard';
import { FlashcardRating } from './flashcard.constant';
import { FlashcardController } from './flashcard.controller';
import { FlashcardService } from './flashcard.service';

describe('FlashcardController (HTTP Integration)', () => {
  let app: INestApplication;
  const flashcardMock = {
    listDecks: jest.fn(),
    createDeck: jest.fn(),
    updateDeck: jest.fn(),
    deleteDeck: jest.fn(),
    listCards: jest.fn(),
    listDueCards: jest.fn(),
    createCard: jest.fn(),
    updateCard: jest.fn(),
    deleteCard: jest.fn(),
    reviewCard: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FlashcardController],
      providers: [{ provide: FlashcardService, useValue: flashcardMock }],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { userId: 'user-test-1' };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const deckId = '11111111-1111-4111-8111-111111111111';
  const cardId = '22222222-2222-4222-8222-222222222222';

  it('GET /flashcards/decks trả danh sách bộ thẻ của người dùng', async () => {
    flashcardMock.listDecks.mockResolvedValue([
      { id: deckId, title: 'Triều Lý' },
    ]);

    const res = await request(app.getHttpServer())
      .get('/flashcards/decks')
      .expect(200);

    expect(flashcardMock.listDecks).toHaveBeenCalledWith('user-test-1');
    expect(res.body[0].title).toBe('Triều Lý');
  });

  it('POST /flashcards/decks từ chối payload thiếu title (400)', async () => {
    await request(app.getHttpServer())
      .post('/flashcards/decks')
      .send({})
      .expect(400);
    expect(flashcardMock.createDeck).not.toHaveBeenCalled();
  });

  it('POST /flashcards/decks tạo bộ thẻ mới', async () => {
    flashcardMock.createDeck.mockResolvedValue({ id: deckId });

    await request(app.getHttpServer())
      .post('/flashcards/decks')
      .send({ title: 'Bộ thẻ mới' })
      .expect(201);

    expect(flashcardMock.createDeck).toHaveBeenCalledWith(
      'user-test-1',
      expect.objectContaining({ title: 'Bộ thẻ mới' }),
    );
  });

  it('PATCH /flashcards/decks/:deckId từ chối deckId không phải UUID (400)', async () => {
    await request(app.getHttpServer())
      .patch('/flashcards/decks/not-a-uuid')
      .send({ title: 'X' })
      .expect(400);
    expect(flashcardMock.updateDeck).not.toHaveBeenCalled();
  });

  it('PATCH /flashcards/decks/:deckId cập nhật bộ thẻ hợp lệ', async () => {
    flashcardMock.updateDeck.mockResolvedValue({ id: deckId, title: 'Đã đổi' });

    await request(app.getHttpServer())
      .patch(`/flashcards/decks/${deckId}`)
      .send({ title: 'Đã đổi' })
      .expect(200);

    expect(flashcardMock.updateDeck).toHaveBeenCalledWith(
      'user-test-1',
      deckId,
      expect.objectContaining({ title: 'Đã đổi' }),
    );
  });

  it('DELETE /flashcards/decks/:deckId xoá bộ thẻ', async () => {
    flashcardMock.deleteDeck.mockResolvedValue({ deleted: true });

    const res = await request(app.getHttpServer())
      .delete(`/flashcards/decks/${deckId}`)
      .expect(200);

    expect(flashcardMock.deleteDeck).toHaveBeenCalledWith(
      'user-test-1',
      deckId,
    );
    expect(res.body.deleted).toBe(true);
  });

  it('GET /flashcards/decks/:deckId/cards và /due trả danh sách thẻ', async () => {
    flashcardMock.listCards.mockResolvedValue([{ id: cardId }]);
    flashcardMock.listDueCards.mockResolvedValue([{ id: cardId }]);

    await request(app.getHttpServer())
      .get(`/flashcards/decks/${deckId}/cards`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/flashcards/decks/${deckId}/due`)
      .expect(200);

    expect(flashcardMock.listCards).toHaveBeenCalledWith('user-test-1', deckId);
    expect(flashcardMock.listDueCards).toHaveBeenCalledWith(
      'user-test-1',
      deckId,
    );
  });

  it('POST /flashcards/decks/:deckId/cards thêm thẻ mới', async () => {
    flashcardMock.createCard.mockResolvedValue({ id: cardId });

    await request(app.getHttpServer())
      .post(`/flashcards/decks/${deckId}/cards`)
      .send({ front: 'Câu hỏi', back: 'Đáp án' })
      .expect(201);

    expect(flashcardMock.createCard).toHaveBeenCalledWith(
      'user-test-1',
      deckId,
      expect.objectContaining({ front: 'Câu hỏi', back: 'Đáp án' }),
    );
  });

  it('PATCH /flashcards/cards/:cardId sửa nội dung thẻ', async () => {
    flashcardMock.updateCard.mockResolvedValue({ id: cardId, front: 'Mới' });

    await request(app.getHttpServer())
      .patch(`/flashcards/cards/${cardId}`)
      .send({ front: 'Mới' })
      .expect(200);

    expect(flashcardMock.updateCard).toHaveBeenCalledWith(
      'user-test-1',
      cardId,
      expect.objectContaining({ front: 'Mới' }),
    );
  });

  it('DELETE /flashcards/cards/:cardId xoá thẻ', async () => {
    flashcardMock.deleteCard.mockResolvedValue({ deleted: true });

    await request(app.getHttpServer())
      .delete(`/flashcards/cards/${cardId}`)
      .expect(200);

    expect(flashcardMock.deleteCard).toHaveBeenCalledWith(
      'user-test-1',
      cardId,
    );
  });

  it('POST /flashcards/cards/:cardId/review từ chối rating sai enum (400)', async () => {
    await request(app.getHttpServer())
      .post(`/flashcards/cards/${cardId}/review`)
      .send({ rating: 'NOT_A_RATING' })
      .expect(400);
    expect(flashcardMock.reviewCard).not.toHaveBeenCalled();
  });

  it('POST /flashcards/cards/:cardId/review chấm điểm SM-2 với rating hợp lệ', async () => {
    flashcardMock.reviewCard.mockResolvedValue({ id: cardId, repetitions: 1 });

    const res = await request(app.getHttpServer())
      .post(`/flashcards/cards/${cardId}/review`)
      .send({ rating: FlashcardRating.GOOD })
      .expect(201);

    expect(flashcardMock.reviewCard).toHaveBeenCalledWith(
      'user-test-1',
      cardId,
      FlashcardRating.GOOD,
    );
    expect(res.body.repetitions).toBe(1);
  });
});
