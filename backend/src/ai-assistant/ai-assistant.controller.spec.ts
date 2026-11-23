import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { AssistantEngine } from './ai-assistant.constant';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';

describe('AiAssistantController (HTTP Integration)', () => {
  let app: INestApplication;
  const assistantMock = {
    chat: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AiAssistantController],
      providers: [{ provide: AiAssistantService, useValue: assistantMock }],
    })
      .overrideGuard(OptionalAuthGuard)
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

  it('POST /ai-assistant/chat từ chối payload rỗng (400)', async () => {
    await request(app.getHttpServer())
      .post('/ai-assistant/chat')
      .send({})
      .expect(400);
    expect(assistantMock.chat).not.toHaveBeenCalled();
  });

  it('POST /ai-assistant/chat trả lời câu hỏi và truyền userId + currentPath', async () => {
    assistantMock.chat.mockResolvedValue({
      reply: 'Xin chào! Tôi là Sử Gia AI HISGO.',
      engine: AssistantEngine.GEMINI_FLASH,
      suggestedLinks: [],
      quickActions: [{ label: 'Luyện tập', href: '/luyen-tap' }],
    });

    const res = await request(app.getHttpServer())
      .post('/ai-assistant/chat')
      .send({
        message: 'Hướng dẫn sử dụng HISGO',
        currentPath: '/bai-viet',
      })
      .expect(200);

    expect(assistantMock.chat).toHaveBeenCalledWith(
      'user-test-1',
      expect.objectContaining({
        message: 'Hướng dẫn sử dụng HISGO',
        currentPath: '/bai-viet',
      }),
    );
    expect(res.body.reply).toContain('Sử Gia AI HISGO');
  });
});
