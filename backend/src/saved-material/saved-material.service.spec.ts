import { SavedMaterialKind } from '@prisma/client';
import { SavedMaterialService } from './saved-material.service';

describe('SavedMaterialService', () => {
  const prisma = {
    savedMaterial: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
  };

  let service: SavedMaterialService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SavedMaterialService(prisma as any);
  });

  it('getSnapshot gom id theo đúng từng loại', async () => {
    prisma.savedMaterial.findMany.mockResolvedValue([
      { kind: SavedMaterialKind.ARTICLE, targetId: 'a1' },
      { kind: SavedMaterialKind.LESSON, targetId: 'l1' },
      { kind: SavedMaterialKind.TIMELINE_NODE, targetId: 't1' },
    ]);

    const snapshot = await service.getSnapshot('u-1');

    expect(snapshot).toEqual({
      articleIds: ['a1'],
      lessonIds: ['l1'],
      timelineNodeIds: ['t1'],
    });
  });

  it('toggle LESSON: chưa lưu thì tạo mới, không đụng tới TIMELINE_NODE', async () => {
    prisma.savedMaterial.findUnique.mockResolvedValue(null);

    const res = await service.toggle('u-1', SavedMaterialKind.LESSON, 'l-1');

    expect(res).toEqual({ saved: true });
    expect(prisma.savedMaterial.create).toHaveBeenCalledWith({
      data: { userId: 'u-1', kind: SavedMaterialKind.LESSON, targetId: 'l-1' },
    });
    expect(prisma.savedMaterial.upsert).not.toHaveBeenCalled();
  });

  it('toggle ARTICLE: lưu mới cũng ghim luôn mốc TIMELINE_NODE tương ứng', async () => {
    prisma.savedMaterial.findUnique.mockResolvedValue(null);

    const res = await service.toggle('u-1', SavedMaterialKind.ARTICLE, 'art-1');

    expect(res).toEqual({ saved: true });
    expect(prisma.savedMaterial.create).toHaveBeenCalledWith({
      data: {
        userId: 'u-1',
        kind: SavedMaterialKind.ARTICLE,
        targetId: 'art-1',
      },
    });
    expect(prisma.savedMaterial.upsert).toHaveBeenCalledWith({
      where: {
        userId_kind_targetId: {
          userId: 'u-1',
          kind: SavedMaterialKind.TIMELINE_NODE,
          targetId: 'art-1',
        },
      },
      update: {},
      create: {
        userId: 'u-1',
        kind: SavedMaterialKind.TIMELINE_NODE,
        targetId: 'art-1',
      },
    });
  });

  it('toggle ARTICLE: bỏ lưu cũng bỏ luôn mốc TIMELINE_NODE đã ghim kèm', async () => {
    prisma.savedMaterial.findUnique.mockResolvedValue({ id: 'sm-1' });

    const res = await service.toggle('u-1', SavedMaterialKind.ARTICLE, 'art-1');

    expect(res).toEqual({ saved: false });
    expect(prisma.savedMaterial.delete).toHaveBeenCalledWith({
      where: { id: 'sm-1' },
    });
    expect(prisma.savedMaterial.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'u-1',
        kind: SavedMaterialKind.TIMELINE_NODE,
        targetId: 'art-1',
      },
    });
  });

  it('remove: xoá trực tiếp theo loại và mã', async () => {
    await service.remove('u-1', SavedMaterialKind.TIMELINE_NODE, 't-1');

    expect(prisma.savedMaterial.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'u-1',
        kind: SavedMaterialKind.TIMELINE_NODE,
        targetId: 't-1',
      },
    });
  });
});
