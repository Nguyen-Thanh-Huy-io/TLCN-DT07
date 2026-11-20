import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NoteColor, NoteKind, NoteTargetType } from '@prisma/client';
import request from 'supertest';
import { NoteController } from './note.controller';
import { NoteAnchorMode, NoteInkTool, NoteMarkupStyle } from './note.constant';
import { NoteService } from './note.service';

describe('NoteController (Mock HTTP + ValidationPipe)', () => {
  let app: INestApplication;
  let mockNoteService: {
    findAll: jest.Mock;
    findLabels: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeAll(async () => {
    mockNoteService = {
      findAll: jest.fn().mockResolvedValue([]),
      findLabels: jest.fn().mockResolvedValue(['Ý nghĩa ĐBP']),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [NoteController],
      providers: [{ provide: NoteService, useValue: mockNoteService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /notes chuyển tiếp đầy đủ Block Cluster Sticky Note + labels', async () => {
    mockNoteService.create.mockResolvedValue({
      id: 'n-block-1',
      kind: NoteKind.SUMMARY,
      color: NoteColor.BLUE,
      content: 'Tóm tắt thắng lợi Điện Biên Phủ',
      labels: ['Ý nghĩa ĐBP'],
      anchor: {
        mode: NoteAnchorMode.BLOCK,
        blockStart: 2,
        blockEnd: 3,
      },
    });

    const res = await request(app.getHttpServer())
      .post('/notes')
      .set('x-guest-id', 'guest-http-1')
      .send({
        targetType: NoteTargetType.ARTICLE,
        targetId: 'article-dbp',
        kind: NoteKind.SUMMARY,
        color: NoteColor.BLUE,
        content: 'Tóm tắt thắng lợi Điện Biên Phủ',
        highlightText: 'Qua đó, thắng lợi của Quân đội Nhân dân Việt Nam...',
        labels: ['Ý nghĩa ĐBP'],
        anchor: {
          mode: NoteAnchorMode.BLOCK,
          blockStart: 2,
          blockEnd: 3,
          startHint: 'Qua đó, thắng lợi',
          endHint: 'thế giới thứ hai.',
        },
      });

    expect(res.status).toBe(201);
    expect(mockNoteService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        guestId: 'guest-http-1',
        kind: NoteKind.SUMMARY,
        labels: ['Ý nghĩa ĐBP'],
        anchor: expect.objectContaining({
          mode: NoteAnchorMode.BLOCK,
          blockStart: 2,
          blockEnd: 3,
        }),
      }),
      undefined,
    );
  });

  it('POST /notes hỗ trợ style UNDERLINE và chặn kiểu không hợp lệ (400)', async () => {
    mockNoteService.create.mockResolvedValue({ id: 'n-line-1' });

    const okRes = await request(app.getHttpServer())
      .post('/notes')
      .set('x-guest-id', 'guest-http-1')
      .send({
        targetType: NoteTargetType.ARTICLE,
        targetId: 'article-dbp',
        content: '',
        highlightText: 'cột mốc đánh dấu thất bại hoàn toàn',
        anchor: {
          style: NoteMarkupStyle.UNDERLINE,
          prefix: 'được xem là ',
          suffix: ' của Pháp',
        },
      });
    expect(okRes.status).toBe(201);

    const badRes = await request(app.getHttpServer())
      .post('/notes')
      .set('x-guest-id', 'guest-http-1')
      .send({
        targetType: NoteTargetType.ARTICLE,
        targetId: 'article-dbp',
        content: 'Ghi chú',
        anchor: {
          style: 'RAINBOW_GLITTER',
        },
      });
    expect(badRes.status).toBe(400);
    expect(mockNoteService.create).toHaveBeenCalledTimes(1);
  });

  it('PATCH /notes/:id trả 400 nếu anchor cụm không hợp lệ', async () => {
    mockNoteService.update.mockRejectedValue(
      new BadRequestException('blockEnd phải >= blockStart'),
    );

    const res = await request(app.getHttpServer())
      .patch('/notes/note-1?guestId=guest-1')
      .send({
        anchor: { mode: NoteAnchorMode.BLOCK, blockStart: 4, blockEnd: 1 },
      });

    expect(res.status).toBe(400);
  });

  it('POST /notes hỗ trợ style CIRCLE (khoanh từ) và CALLOUT (chữ bổ sung)', async () => {
    mockNoteService.create.mockResolvedValue({ id: 'n-circle-1' });

    const circleRes = await request(app.getHttpServer())
      .post('/notes')
      .set('x-guest-id', 'guest-http-1')
      .send({
        targetType: NoteTargetType.ARTICLE,
        targetId: 'article-dbp',
        content: '',
        highlightText: '1961',
        anchor: {
          mode: NoteAnchorMode.INLINE,
          style: NoteMarkupStyle.CIRCLE,
          prefix: '+ ',
          suffix: ': Hiệp hội',
        },
      });
    expect(circleRes.status).toBe(201);

    const calloutRes = await request(app.getHttpServer())
      .post('/notes')
      .set('x-guest-id', 'guest-http-1')
      .send({
        targetType: NoteTargetType.ARTICLE,
        targetId: 'article-dbp',
        kind: NoteKind.NOTE,
        content: 'nhưng Mỹ chưa thực hiện được',
        highlightText: 'đơn cực',
        anchor: {
          mode: NoteAnchorMode.INLINE,
          style: NoteMarkupStyle.CALLOUT,
          prefix: 'thế giới ',
          suffix: '.',
        },
      });
    expect(calloutRes.status).toBe(201);
  });

  it('POST /notes hỗ trợ vẽ tự do (INK) và chặn tool sai enum (400)', async () => {
    mockNoteService.create.mockResolvedValue({ id: 'n-ink-1' });

    const okRes = await request(app.getHttpServer())
      .post('/notes')
      .set('x-guest-id', 'guest-http-1')
      .send({
        targetType: NoteTargetType.ARTICLE,
        targetId: 'article-dbp',
        kind: NoteKind.HIGHLIGHT,
        content: '',
        highlightText: 'Chiến dịch Điện Biên Phủ',
        anchor: {
          mode: NoteAnchorMode.INK,
          blockStart: 0,
          inkItems: [
            {
              id: 'stroke-1',
              tool: NoteInkTool.HIGHLIGHTER,
              color: NoteColor.YELLOW,
              width: 18,
              pts: [0.1, 0.2, 0.4, 0.22],
            },
          ],
        },
      });
    expect(okRes.status).toBe(201);

    const badRes = await request(app.getHttpServer())
      .post('/notes')
      .set('x-guest-id', 'guest-http-1')
      .send({
        targetType: NoteTargetType.ARTICLE,
        targetId: 'article-dbp',
        content: 'Vẽ',
        anchor: {
          mode: NoteAnchorMode.INK,
          blockStart: 0,
          inkItems: [
            {
              id: 'bad-1',
              tool: 'SPRAY_PAINT',
              color: NoteColor.PINK,
            },
          ],
        },
      });
    expect(badRes.status).toBe(400);
  });
});
