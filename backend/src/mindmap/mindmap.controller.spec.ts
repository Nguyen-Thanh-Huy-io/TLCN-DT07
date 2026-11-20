import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthGuard } from '../common/guards/auth.guard';
import { MindmapController } from './mindmap.controller';
import { MindmapService } from './mindmap.service';

describe('MindmapController (HTTP Integration)', () => {
  let app: INestApplication;
  const mindmapMock = {
    list: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MindmapController],
      providers: [{ provide: MindmapService, useValue: mindmapMock }],
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

  const validUuid = '11111111-1111-4111-8111-111111111111';

  it('GET /mindmaps trả danh sách sơ đồ của người dùng hiện tại', async () => {
    mindmapMock.list.mockResolvedValue([{ id: 'mm-1', title: 'Nhà Trần' }]);

    const res = await request(app.getHttpServer()).get('/mindmaps').expect(200);

    expect(mindmapMock.list).toHaveBeenCalledWith('user-test-1');
    expect(res.body[0].title).toBe('Nhà Trần');
  });

  it('GET /mindmaps/:id từ chối id không phải UUID (400)', async () => {
    await request(app.getHttpServer()).get('/mindmaps/not-a-uuid').expect(400);
    expect(mindmapMock.findOne).not.toHaveBeenCalled();
  });

  it('GET /mindmaps/:id trả chi tiết khi id hợp lệ', async () => {
    mindmapMock.findOne.mockResolvedValue({ id: validUuid, title: 'Chi tiết' });

    const res = await request(app.getHttpServer())
      .get(`/mindmaps/${validUuid}`)
      .expect(200);

    expect(mindmapMock.findOne).toHaveBeenCalledWith('user-test-1', validUuid);
    expect(res.body.title).toBe('Chi tiết');
  });

  it('POST /mindmaps từ chối payload thiếu title (400)', async () => {
    await request(app.getHttpServer()).post('/mindmaps').send({}).expect(400);
    expect(mindmapMock.create).not.toHaveBeenCalled();
  });

  it('POST /mindmaps tạo sơ đồ mới với payload hợp lệ', async () => {
    mindmapMock.create.mockResolvedValue({ id: 'mm-2', title: 'Sơ đồ mới' });

    const res = await request(app.getHttpServer())
      .post('/mindmaps')
      .send({ title: 'Sơ đồ mới' })
      .expect(201);

    expect(mindmapMock.create).toHaveBeenCalledWith(
      'user-test-1',
      expect.objectContaining({ title: 'Sơ đồ mới' }),
    );
    expect(res.body.id).toBe('mm-2');
  });

  it('PATCH /mindmaps/:id cập nhật sơ đồ đã có', async () => {
    mindmapMock.update.mockResolvedValue({
      id: validUuid,
      title: 'Đã đổi tên',
    });

    const res = await request(app.getHttpServer())
      .patch(`/mindmaps/${validUuid}`)
      .send({ title: 'Đã đổi tên' })
      .expect(200);

    expect(mindmapMock.update).toHaveBeenCalledWith(
      'user-test-1',
      validUuid,
      expect.objectContaining({ title: 'Đã đổi tên' }),
    );
    expect(res.body.title).toBe('Đã đổi tên');
  });

  it('DELETE /mindmaps/:id xoá sơ đồ', async () => {
    mindmapMock.remove.mockResolvedValue({ deleted: true });

    const res = await request(app.getHttpServer())
      .delete(`/mindmaps/${validUuid}`)
      .expect(200);

    expect(mindmapMock.remove).toHaveBeenCalledWith('user-test-1', validUuid);
    expect(res.body.deleted).toBe(true);
  });
});
