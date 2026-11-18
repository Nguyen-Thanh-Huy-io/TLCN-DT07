import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NoteColor, NoteTargetType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateNoteDto } from './dto/note.dto';
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

    it('lưu vị trí đoạn bôi đen để tô lại trong bài', async () => {
      mockPrisma.note.create.mockResolvedValue({ id: 'note-002' });

      await service.create(
        {
          targetType: NoteTargetType.ARTICLE,
          targetId: 'art-123',
          content: '',
          highlightText: 'Ngô Quyền',
          anchor: { prefix: 'năm 938, ', suffix: ' đánh tan' },
        },
        'user-123',
      );

      expect(mockPrisma.note.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: '',
            highlightText: 'Ngô Quyền',
            anchor: { prefix: 'năm 938, ', suffix: ' đánh tan' },
          }),
        }),
      );
    });
  });

  describe('CreateNoteDto', () => {
    const base = { targetType: NoteTargetType.ARTICLE, targetId: 'art-1' };
    const errorsOf = (plain: object) =>
      validate(plainToInstance(CreateNoteDto, plain));

    it('chỉ tô màu (nội dung rỗng) hợp lệ khi có đoạn bôi đen', async () => {
      expect(
        await errorsOf({ ...base, content: '', highlightText: 'Bạch Đằng' }),
      ).toHaveLength(0);
    });

    it('không có đoạn bôi đen thì bắt buộc có nội dung', async () => {
      const errors = await errorsOf({ ...base, content: '' });
      expect(errors.map((e) => e.property)).toContain('content');
    });
  });

  describe('update', () => {
    it('không cho xoá trắng nội dung của ghi chú không gắn đoạn nào', async () => {
      mockPrisma.note.findUnique.mockResolvedValue({
        id: 'note-1',
        userId: 'user-1',
        guestId: null,
        highlightText: null,
      });

      await expect(
        service.update('note-1', { content: '  ' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.note.update).not.toHaveBeenCalled();
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

    it('không có userId lẫn guestId thì trả rỗng, không lộ ghi chú người khác', async () => {
      const res = await service.findAll(undefined, {
        targetType: NoteTargetType.ARTICLE,
        targetId: 'art-1',
      });

      expect(res).toEqual([]);
      expect(mockPrisma.note.findMany).not.toHaveBeenCalled();
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
