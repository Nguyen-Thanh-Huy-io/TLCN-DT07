import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NoteColor, NoteKind, NoteTargetType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateNoteDto } from './dto/note.dto';
import { NoteService } from './note.service';

describe('NoteService', () => {
  let service: NoteService;
  let mockPrisma: any;
  let mockRegistry: any;
  let mockStrategy: any;
  let mockRevision: any;

  beforeEach(() => {
    mockPrisma = {
      note: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $queryRaw: jest.fn(),
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

    mockRevision = { liveVersion: jest.fn().mockResolvedValue(3) };
    service = new NoteService(mockPrisma, mockRegistry, mockRevision);
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

    it('ghi loại (không gửi thì suy từ nội dung), phiên bản bài hiện hành và nhãn đã chuẩn hoá', async () => {
      mockPrisma.note.create.mockResolvedValue({ id: 'note-003' });

      await service.create(
        {
          targetType: NoteTargetType.LESSON,
          targetId: 'lesson-1',
          content: '',
          highlightText: 'Bạch Đằng',
          labels: [' Thi học kỳ ', 'Thi học kỳ', ''],
        },
        'user-1',
      );

      expect(mockRevision.liveVersion).toHaveBeenCalledWith(
        'LESSON',
        'lesson-1',
      );
      expect(mockPrisma.note.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            kind: NoteKind.HIGHLIGHT,
            contentVersion: 3,
            labels: ['Thi học kỳ'],
          }),
        }),
      );
    });
  });

  describe('findLabels', () => {
    it('trả nhãn người học đã dùng; không có danh tính thì rỗng, không truy vấn', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { label: 'Nhà Trần' },
        { label: 'Thi học kỳ' },
      ]);

      expect(await service.findLabels('user-1')).toEqual([
        'Nhà Trần',
        'Thi học kỳ',
      ]);
      expect(await service.findLabels()).toEqual([]);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
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

    it('Quan trọng được để trống nội dung; Câu hỏi thì không', async () => {
      const quote = { ...base, content: '', highlightText: 'năm 1288' };
      expect(
        await errorsOf({ ...quote, kind: NoteKind.IMPORTANT }),
      ).toHaveLength(0);
      const errors = await errorsOf({ ...quote, kind: NoteKind.QUESTION });
      expect(errors.map((e) => e.property)).toContain('content');
    });

    it('Định nghĩa bắt buộc có thuật ngữ (đoạn bôi đen)', async () => {
      const errors = await errorsOf({
        ...base,
        kind: NoteKind.DEFINITION,
        content: 'Bài hịch khích lệ tướng sĩ',
      });
      expect(errors.map((e) => e.property)).toContain('highlightText');
    });
  });

  describe('update', () => {
    const owned = {
      id: 'note-1',
      userId: 'user-1',
      guestId: null,
      targetType: NoteTargetType.ARTICLE,
      targetId: 'art-1',
    };

    it('tô sáng được viết thêm nội dung thì thành ghi chú', async () => {
      mockPrisma.note.findUnique.mockResolvedValue({
        ...owned,
        kind: NoteKind.HIGHLIGHT,
        content: '',
        highlightText: 'Bạch Đằng',
      });

      await service.update('note-1', { content: 'Trận thủy chiến' }, 'user-1');

      expect(mockPrisma.note.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ kind: NoteKind.NOTE }),
        }),
      );
    });

    it('đánh dấu câu hỏi đã hiểu và gắn lại vị trí theo phiên bản bài mới', async () => {
      mockPrisma.note.findUnique.mockResolvedValue({
        ...owned,
        kind: NoteKind.QUESTION,
        content: 'Vì sao?',
        highlightText: 'vườn không nhà trống',
      });

      await service.update(
        'note-1',
        { resolved: true, anchor: { prefix: 'kế ', suffix: ' khiến' } },
        'user-1',
      );

      expect(mockPrisma.note.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resolvedAt: expect.any(Date),
            anchor: { prefix: 'kế ', suffix: ' khiến' },
            contentVersion: 3,
          }),
        }),
      );
    });

    it('không cho xoá trắng nội dung của ghi chú không gắn đoạn nào', async () => {
      mockPrisma.note.findUnique.mockResolvedValue({
        id: 'note-1',
        userId: 'user-1',
        guestId: null,
        highlightText: null,
        kind: NoteKind.NOTE,
        content: 'cũ',
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

    it('khi không truyền targetId thì gắn kèm tiêu đề và slug của bài viết / bài học gốc', async () => {
      mockPrisma.note.findMany.mockResolvedValue([
        { id: 'n1', targetType: NoteTargetType.ARTICLE, targetId: 'art-1', content: 'A' },
        { id: 'n2', targetType: NoteTargetType.LESSON, targetId: 'les-1', content: 'B' },
      ]);
      mockPrisma.article = {
        findMany: jest.fn().mockResolvedValue([
          { id: 'art-1', title: 'Chiến thắng Bạch Đằng', slug: 'chien-thang-bach-dang' },
        ]),
      };
      mockPrisma.lesson = {
        findMany: jest.fn().mockResolvedValue([
          { id: 'les-1', title: 'Nhà Ngô lập quốc', slug: 'nha-ngo-lap-quoc' },
        ]),
      };

      const res = (await service.findAll('user-1', {})) as Array<{
        id: string;
        target?: { title: string; slug: string } | null;
      }>;

      expect(res).toHaveLength(2);
      expect(res[0].target).toEqual({
        title: 'Chiến thắng Bạch Đằng',
        slug: 'chien-thang-bach-dang',
      });
      expect(res[1].target).toEqual({
        title: 'Nhà Ngô lập quốc',
        slug: 'nha-ngo-lap-quoc',
      });
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
