import { NotFoundException } from '@nestjs/common';
import { NoteColor, NoteTargetType } from '@prisma/client';
import { NoteService } from './note.service';

describe('NoteService', () => {
  let service: NoteService;
  let mockPrisma: any;
  let mockRegistry: any;
  let mockStrategy: any;

  beforeEach(() => {
    mockPrisma = {
      note: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    mockStrategy = {
      validateTarget: jest.fn().mockResolvedValue(true),
      getTargetMeta: jest.fn().mockResolvedValue({
        title: 'Chiến dịch Điện Biên Phủ',
        type: NoteTargetType.ARTICLE,
      }),
    };

    mockRegistry = {
      getStrategy: jest.fn().mockReturnValue(mockStrategy),
    };

    service = new NoteService(mockPrisma, mockRegistry);
  });

  describe('create', () => {
    it('tạo ghi chú thành công khi targetId hợp lệ', async () => {
      const dto = {
        targetType: NoteTargetType.ARTICLE,
        targetId: 'art-123',
        title: 'Mốc thời gian quan trọng',
        content: 'Bắt đầu từ ngày 13/03/1954 đến 07/05/1954',
        highlightText: 'ngày 13/03/1954',
        color: NoteColor.YELLOW,
        guestId: 'guest-abc',
      };

      mockPrisma.note.create.mockResolvedValue({
        id: 'note-001',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.create(dto, 'user-123');

      expect(mockRegistry.getStrategy).toHaveBeenCalledWith(
        NoteTargetType.ARTICLE,
      );
      expect(mockStrategy.validateTarget).toHaveBeenCalledWith('art-123');
      expect(mockPrisma.note.create).toHaveBeenCalled();
      expect(res.id).toBe('note-001');
    });

    it('báo lỗi NotFoundException nếu targetId không tồn tại', async () => {
      mockStrategy.validateTarget.mockResolvedValue(false);

      const dto = {
        targetType: NoteTargetType.LESSON,
        targetId: 'non-existing-lesson',
        content: 'Nội dung ghi chú',
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('lấy danh sách ghi chú theo targetId và guestId', async () => {
      const sampleNotes = [
        {
          id: 'note-1',
          targetType: NoteTargetType.ARTICLE,
          targetId: 'art-1',
          content: 'Ghi chú 1',
        },
      ];
      mockPrisma.note.findMany.mockResolvedValue(sampleNotes);

      const res = await service.findAll(undefined, {
        targetType: NoteTargetType.ARTICLE,
        targetId: 'art-1',
        guestId: 'guest-xyz',
      });

      expect(mockPrisma.note.findMany).toHaveBeenCalled();
      expect(res).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('xoá ghi chú thành công khi đúng chủ sở hữu', async () => {
      mockPrisma.note.findUnique.mockResolvedValue({
        id: 'note-1',
        userId: 'user-1',
        guestId: null,
      });
      mockPrisma.note.delete.mockResolvedValue({ id: 'note-1' });

      const res = await service.remove('note-1', 'user-1');
      expect(res).toEqual({ id: 'note-1' });
      expect(mockPrisma.note.delete).toHaveBeenCalledWith({
        where: { id: 'note-1' },
      });
    });
  });
});
