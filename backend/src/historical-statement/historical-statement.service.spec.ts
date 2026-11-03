import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HistoricalStatementService } from './historical-statement.service';
import { StatementValidationEngine } from './validation/statement-validation.engine';
import { PrismaService } from '../common/services/prisma.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { StatementValueType } from '@prisma/client';
import { STATEMENT_ERROR_MESSAGES } from './historical-statement.constant';

describe('HistoricalStatementService & Validation Engine (Stage 2 Test Suite)', () => {
  let service: HistoricalStatementService;
  let validationEngine: StatementValidationEngine;

  const mockEntityA = {
    id: 'ent-a',
    name: 'Lê Lợi',
    slug: 'le-loi',
    type: 'PERSON',
    imageUrl: 'https://example.com/leloi.png',
    startYear: 1385,
    endYear: 1433,
    dateText: '1385 - 1433',
  };

  const mockEntityB = {
    id: 'ent-b',
    name: 'Nguyễn Trãi',
    slug: 'nguyen-trai',
    type: 'PERSON',
    imageUrl: 'https://example.com/nguyentrai.png',
    startYear: 1380,
    endYear: 1442,
    dateText: '1380 - 1442',
  };

  const mockPredicateAdvised = {
    id: 'pred-advised',
    code: 'ADVISED',
    label: 'Mưu sĩ / Cố vấn cho',
    inverseLabel: 'Được cố vấn bởi',
    isActive: true,
  };

  const mockPrisma = {
    historicalStatement: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    historicalStatementReference: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    historicalEntity: {
      findUnique: jest.fn(),
    },
    taxonomyTerm: {
      findUnique: jest.fn(),
    },
    taxonomyPredicateRule: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => callback(mockPrisma)),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoricalStatementService,
        StatementValidationEngine,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<HistoricalStatementService>(HistoricalStatementService);
    validationEngine = module.get<StatementValidationEngine>(StatementValidationEngine);
  });

  describe('1. Strategy Pattern Validation Rules', () => {
    it('ném lỗi BadRequestException khi vi phạm Exactly One Object (không có object nào)', async () => {
      await expect(
        validationEngine.validateStatement({
          subjectId: 'ent-a',
          predicateId: 'pred-1',
        }),
      ).rejects.toThrow(
        new BadRequestException(STATEMENT_ERROR_MESSAGES.EXACTLY_ONE_OBJECT),
      );
    });

    it('ném lỗi BadRequestException khi tự lặp Self Loop (subjectId === objectId)', async () => {
      await expect(
        validationEngine.validateStatement({
          subjectId: 'ent-a',
          predicateId: 'pred-1',
          objectId: 'ent-a',
        }),
      ).rejects.toThrow(
        new BadRequestException(STATEMENT_ERROR_MESSAGES.NO_SELF_LOOP),
      );
    });

    it('ném lỗi BadRequestException khi phạm quy ước lịch sử không có năm 0', async () => {
      await expect(
        validationEngine.validateStatement({
          subjectId: 'ent-a',
          predicateId: 'pred-1',
          objectId: 'ent-b',
          validFromYear: 0,
        }),
      ).rejects.toThrow(
        new BadRequestException(STATEMENT_ERROR_MESSAGES.NO_YEAR_ZERO),
      );
    });

    it('ném lỗi BadRequestException khi validToYear < validFromYear', async () => {
      await expect(
        validationEngine.validateStatement({
          subjectId: 'ent-a',
          predicateId: 'pred-1',
          objectId: 'ent-b',
          validFromYear: 1427,
          validToYear: 1418,
        }),
      ).rejects.toThrow(
        new BadRequestException(STATEMENT_ERROR_MESSAGES.INVALID_YEAR_RANGE),
      );
    });

    it('ném lỗi NotFoundException khi Predicate không tồn tại trong Taxonomy', async () => {
      mockPrisma.taxonomyTerm.findUnique.mockResolvedValueOnce(null);

      await expect(
        validationEngine.validateStatement({
          subjectId: 'ent-a',
          predicateId: 'invalid-predicate',
          objectId: 'ent-b',
        }),
      ).rejects.toThrow(
        new NotFoundException(STATEMENT_ERROR_MESSAGES.PREDICATE_NOT_FOUND),
      );
    });

    it('ném lỗi BadRequestException khi Predicate đang bị vô hiệu hoá (isActive = false)', async () => {
      mockPrisma.taxonomyTerm.findUnique.mockResolvedValueOnce({
        id: 'pred-inactive',
        isActive: false,
      });

      await expect(
        validationEngine.validateStatement({
          subjectId: 'ent-a',
          predicateId: 'pred-inactive',
          objectId: 'ent-b',
        }),
      ).rejects.toThrow(
        new BadRequestException(STATEMENT_ERROR_MESSAGES.PREDICATE_NOT_ACTIVE),
      );
    });

    it('ném lỗi BadRequestException khi trùng lặp quan hệ đã tồn tại', async () => {
      mockPrisma.taxonomyTerm.findUnique.mockResolvedValueOnce(mockPredicateAdvised);
      mockPrisma.historicalEntity.findUnique
        .mockResolvedValueOnce({ id: 'ent-b' })
        .mockResolvedValueOnce({ id: 'ent-a' });
      mockPrisma.historicalStatement.findFirst.mockResolvedValueOnce({ id: 'existing-stmt-1' });

      await expect(
        validationEngine.validateStatement({
          subjectId: 'ent-b',
          predicateId: 'pred-advised',
          objectId: 'ent-a',
        }),
      ).rejects.toThrow(
        new BadRequestException(STATEMENT_ERROR_MESSAGES.DUPLICATE_STATEMENT),
      );
    });

    it('Literal Strategy: ném lỗi nếu objectValueType là NUMBER nhưng truyền chữ không thể parse', async () => {
      mockPrisma.taxonomyTerm.findUnique.mockResolvedValueOnce(mockPredicateAdvised);
      mockPrisma.historicalEntity.findUnique.mockResolvedValueOnce({ id: 'ent-a' });

      await expect(
        validationEngine.validateStatement({
          subjectId: 'ent-a',
          predicateId: 'pred-advised',
          objectValue: 'not-a-number',
          objectValueType: StatementValueType.NUMBER,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. HistoricalStatement CRUD Operations', () => {
    it('tạo phát biểu Entity ↔ Entity thành công và gắn trích dẫn nguồn tham khảo', async () => {
      mockPrisma.taxonomyTerm.findUnique.mockResolvedValueOnce(mockPredicateAdvised);
      mockPrisma.historicalEntity.findUnique
        .mockResolvedValueOnce({ id: 'ent-b' })
        .mockResolvedValueOnce({ id: 'ent-a' });
      mockPrisma.historicalStatement.findFirst.mockResolvedValueOnce(null);

      const createdStatementId = 'stmt-100';
      mockPrisma.historicalStatement.create.mockResolvedValueOnce({
        id: createdStatementId,
        subjectId: 'ent-b',
        predicateId: 'pred-advised',
        objectId: 'ent-a',
      });

      mockPrisma.historicalStatement.findUnique.mockResolvedValueOnce({
        id: createdStatementId,
        subjectId: 'ent-b',
        predicateId: 'pred-advised',
        objectId: 'ent-a',
        predicate: mockPredicateAdvised,
        subject: mockEntityB,
        object: mockEntityA,
        references: [],
      });

      const res = await service.create({
        subjectId: 'ent-b',
        predicateId: 'pred-advised',
        objectId: 'ent-a',
        validFromYear: 1418,
        validToYear: 1428,
        isPrimary: true,
        references: [
          {
            referenceId: 'ref-daiviet',
            pageNumber: 'tr. 210',
            quote: 'Bình Ngô Đại Cáo',
          },
        ],
      });

      expect(mockPrisma.historicalStatement.create).toHaveBeenCalled();
      expect(mockPrisma.historicalStatementReference.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            statementId: createdStatementId,
            referenceId: 'ref-daiviet',
            pageNumber: 'tr. 210',
          }),
        ],
      });
      expect(res.id).toBe(createdStatementId);
    });

    it('cập nhật phát biểu lịch sử thành công', async () => {
      mockPrisma.historicalStatement.findUnique.mockResolvedValueOnce({
        id: 'stmt-1',
        subjectId: 'ent-b',
        predicateId: 'pred-advised',
        objectId: 'ent-a',
        validFromYear: 1418,
        validToYear: 1428,
      });

      mockPrisma.taxonomyTerm.findUnique.mockResolvedValueOnce(mockPredicateAdvised);
      mockPrisma.historicalEntity.findUnique
        .mockResolvedValueOnce({ id: 'ent-b' })
        .mockResolvedValueOnce({ id: 'ent-a' });
      mockPrisma.historicalStatement.findFirst.mockResolvedValueOnce(null);

      mockPrisma.historicalStatement.update.mockResolvedValueOnce({
        id: 'stmt-1',
        validToYear: 1433,
      });

      mockPrisma.historicalStatement.findUnique.mockResolvedValueOnce({
        id: 'stmt-1',
        subjectId: 'ent-b',
        predicateId: 'pred-advised',
        objectId: 'ent-a',
        validFromYear: 1418,
        validToYear: 1433,
        predicate: mockPredicateAdvised,
      });

      const res = await service.update('stmt-1', {
        validToYear: 1433,
      });

      expect(mockPrisma.historicalStatement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'stmt-1' },
          data: expect.objectContaining({ validToYear: 1433 }),
        }),
      );
      expect(res.validToYear).toBe(1433);
    });

    it('xoá phát biểu lịch sử thành công', async () => {
      mockPrisma.historicalStatement.findUnique.mockResolvedValueOnce({
        id: 'stmt-delete',
      });
      mockPrisma.historicalStatement.delete.mockResolvedValueOnce({
        id: 'stmt-delete',
      });

      const res = await service.remove('stmt-delete');
      expect(res.success).toBe(true);
      expect(mockPrisma.historicalStatement.delete).toHaveBeenCalledWith({
        where: { id: 'stmt-delete' },
      });
    });
  });

  describe('3. Knowledge Graph Traversal (getGraph)', () => {
    it('duyệt đồ thị đa bậc BFS xung quanh 1 Entity và trả về Nodes & Edges chuẩn xác', async () => {
      mockPrisma.historicalEntity.findUnique.mockResolvedValueOnce(mockEntityA);

      // BFS Level 1
      mockPrisma.historicalStatement.findMany.mockResolvedValueOnce([
        {
          id: 'edge-1',
          subjectId: 'ent-b',
          predicateId: 'pred-advised',
          objectId: 'ent-a',
          validFromYear: 1418,
          validToYear: 1428,
          isPrimary: true,
          qualifiers: null,
          predicate: mockPredicateAdvised,
          subject: mockEntityB,
          object: mockEntityA,
        },
      ]);

      const graph = await service.getGraph({
        nodeId: 'ent-a',
        depth: 1,
      });

      expect(graph.rootNodeId).toBe('ent-a');
      expect(graph.totalNodes).toBe(2);
      expect(graph.totalEdges).toBe(1);
      expect(graph.nodes.some((n) => n.id === 'ent-a')).toBe(true);
      expect(graph.nodes.some((n) => n.id === 'ent-b')).toBe(true);
      expect(graph.edges[0].predicateCode).toBe('ADVISED');
    });
  });
});
