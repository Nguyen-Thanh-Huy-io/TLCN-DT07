import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { StatementValidationEngine } from './validation/statement-validation.engine';
import { CreateHistoricalStatementDto } from './dto/create-statement.dto';
import { UpdateHistoricalStatementDto } from './dto/update-statement.dto';
import { QueryHistoricalStatementDto } from './dto/query-statement.dto';
import {
  QueryStatementGraphDto,
  StatementGraphResponseDto,
  GraphNodeDto,
  GraphEdgeDto,
} from './dto/statement-graph.dto';
import {
  STATEMENT_CONSTANTS,
  STATEMENT_ERROR_MESSAGES,
  STATEMENT_NODE_KIND,
} from './historical-statement.constant';

@Injectable()
export class HistoricalStatementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customLogger: CustomLoggerService,
    private readonly validationEngine: StatementValidationEngine,
  ) {}

  /**
   * Tạo mới một phát biểu / quan hệ lịch sử
   */
  async create(dto: CreateHistoricalStatementDto) {
    this.customLogger.log(
      `Tạo phát biểu mới với Predicate ID: ${dto.predicateId}`,
      HistoricalStatementService.name,
    );

    // Xác thực toàn diện qua Strategy Pattern
    await this.validationEngine.validateStatement(dto);

    const { references, ...statementData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const statement = await tx.historicalStatement.create({
        data: {
          subjectEntityId: statementData.subjectEntityId || null,
          subjectEventId: statementData.subjectEventId || null,
          predicateId: statementData.predicateId,
          objectEntityId: statementData.objectEntityId || null,
          objectEventId: statementData.objectEventId || null,
          objectValue: statementData.objectValue ?? null,
          objectValueType: statementData.objectValueType || null,
          validFromYear: statementData.validFromYear || null,
          validToYear: statementData.validToYear || null,
          displayOrder: statementData.displayOrder ?? 0,
          isPrimary: statementData.isPrimary ?? false,
          qualifiers: statementData.qualifiers || undefined,
          verificationStatus: statementData.verificationStatus || undefined,
          rank: statementData.rank || undefined,
        },
      });

      if (references && references.length > 0) {
        await tx.historicalStatementReference.createMany({
          data: references.map((ref) => ({
            statementId: statement.id,
            referenceId: ref.referenceId,
            pageNumber: ref.pageNumber || null,
            chapter: ref.chapter || null,
            quote: ref.quote || null,
            note: ref.note || null,
          })),
        });
      }

      return this.getStatementWithRelations(statement.id, tx);
    });
  }

  /**
   * Cập nhật phát biểu
   */
  async update(id: string, dto: UpdateHistoricalStatementDto) {
    const existing = await this.prisma.historicalStatement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(STATEMENT_ERROR_MESSAGES.STATEMENT_NOT_FOUND);
    }

    const mergedPayload = {
      subjectEntityId:
        dto.subjectEntityId !== undefined
          ? dto.subjectEntityId
          : existing.subjectEntityId,
      subjectEventId:
        dto.subjectEventId !== undefined
          ? dto.subjectEventId
          : existing.subjectEventId,
      predicateId:
        dto.predicateId !== undefined ? dto.predicateId : existing.predicateId,
      objectEntityId:
        dto.objectEntityId !== undefined
          ? dto.objectEntityId
          : existing.objectEntityId,
      objectEventId:
        dto.objectEventId !== undefined
          ? dto.objectEventId
          : existing.objectEventId,
      objectValue:
        dto.objectValue !== undefined
          ? dto.objectValue
          : existing.objectValue,
      objectValueType:
        dto.objectValueType !== undefined
          ? dto.objectValueType
          : existing.objectValueType,
      validFromYear:
        dto.validFromYear !== undefined
          ? dto.validFromYear
          : existing.validFromYear,
      validToYear:
        dto.validToYear !== undefined ? dto.validToYear : existing.validToYear,
    };

    // Xác thực lại tính toàn vẹn
    await this.validationEngine.validateStatement(mergedPayload, id);

    const { references, ...updateData } = dto;

    return this.prisma.$transaction(async (tx) => {
      await tx.historicalStatement.update({
        where: { id },
        data: {
          ...updateData,
          qualifiers:
            updateData.qualifiers !== undefined
              ? updateData.qualifiers
              : undefined,
        },
      });

      if (references) {
        // Xoá và tạo lại danh sách trích dẫn nguồn
        await tx.historicalStatementReference.deleteMany({
          where: { statementId: id },
        });

        if (references.length > 0) {
          await tx.historicalStatementReference.createMany({
            data: references.map((ref) => ({
              statementId: id,
              referenceId: ref.referenceId,
              pageNumber: ref.pageNumber || null,
              chapter: ref.chapter || null,
              quote: ref.quote || null,
              note: ref.note || null,
            })),
          });
        }
      }

      return this.getStatementWithRelations(id, tx);
    });
  }

  /**
   * Xoá phát biểu
   */
  async remove(id: string) {
    const existing = await this.prisma.historicalStatement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(STATEMENT_ERROR_MESSAGES.STATEMENT_NOT_FOUND);
    }

    await this.prisma.historicalStatement.delete({
      where: { id },
    });

    return { success: true, message: 'Đã xoá phát biểu lịch sử thành công.' };
  }

  /**
   * Lấy chi tiết một phát biểu
   */
  async findOne(id: string) {
    const statement = await this.getStatementWithRelations(id);
    if (!statement) {
      throw new NotFoundException(STATEMENT_ERROR_MESSAGES.STATEMENT_NOT_FOUND);
    }
    return statement;
  }

  /**
   * Tìm kiếm và phân trang phát biểu
   */
  async findMany(query: QueryHistoricalStatementDto) {
    const page = query.page || STATEMENT_CONSTANTS.DEFAULT_PAGE;
    const limit = query.limit || STATEMENT_CONSTANTS.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Lọc theo Node ID ở bất kỳ vị trí nào
    if (query.nodeId) {
      where.OR = [
        { subjectEntityId: query.nodeId },
        { subjectEventId: query.nodeId },
        { objectEntityId: query.nodeId },
        { objectEventId: query.nodeId },
      ];
    }

    // Lọc theo Subject
    if (query.subjectId) {
      where.OR = [
        { subjectEntityId: query.subjectId },
        { subjectEventId: query.subjectId },
      ];
    }
    if (query.subjectEntityId) {
      where.subjectEntityId = query.subjectEntityId;
    }
    if (query.subjectEventId) {
      where.subjectEventId = query.subjectEventId;
    }

    // Lọc theo Object
    if (query.objectId) {
      where.OR = [
        { objectEntityId: query.objectId },
        { objectEventId: query.objectId },
      ];
    }
    if (query.objectEntityId) {
      where.objectEntityId = query.objectEntityId;
    }
    if (query.objectEventId) {
      where.objectEventId = query.objectEventId;
    }

    // Lọc theo Predicate
    if (query.predicateId) {
      where.predicateId = query.predicateId;
    }
    if (query.predicateCode) {
      where.predicate = { code: query.predicateCode };
    }

    // Lọc theo trạng thái và thuộc tính
    if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }
    if (query.rank) {
      where.rank = query.rank;
    }
    if (query.isPrimary !== undefined) {
      where.isPrimary = query.isPrimary;
    }

    // Lọc theo niên đại
    if (query.year !== undefined) {
      where.AND = [
        {
          OR: [
            { validFromYear: null },
            { validFromYear: { lte: query.year } },
          ],
        },
        {
          OR: [{ validToYear: null }, { validToYear: { gte: query.year } }],
        },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.historicalStatement.count({ where }),
      this.prisma.historicalStatement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: this.getStatementIncludeOptions(),
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Duyệt đồ thị tri thức (Knowledge Graph Traversal) xung quanh 1 Node (Entity hoặc Event)
   */
  async getGraph(query: QueryStatementGraphDto): Promise<StatementGraphResponseDto> {
    const { nodeId, depth = STATEMENT_CONSTANTS.DEFAULT_GRAPH_DEPTH } = query;

    // 1. Kiểm tra node gốc tồn tại (là Entity hay Event)
    const [rootEntity, rootEvent] = await Promise.all([
      this.prisma.historicalEntity.findUnique({
        where: { id: nodeId },
      }),
      this.prisma.historicalEvent.findUnique({
        where: { id: nodeId },
      }),
    ]);

    if (!rootEntity && !rootEvent) {
      throw new NotFoundException(STATEMENT_ERROR_MESSAGES.TARGET_NODE_NOT_FOUND);
    }

    const nodeMap = new Map<string, GraphNodeDto>();
    const edgeMap = new Map<string, GraphEdgeDto>();

    // Đưa node gốc vào Map
    if (rootEntity) {
      nodeMap.set(rootEntity.id, {
        id: rootEntity.id,
        label: rootEntity.name,
        kind: 'ENTITY',
        typeCode: rootEntity.type,
        typeLabel: rootEntity.type,
        avatarUrl: rootEntity.imageUrl || undefined,
        startYear: rootEntity.startYear,
        endYear: rootEntity.endYear,
        dateText: rootEntity.dateText,
        distance: 0,
      });
    } else if (rootEvent) {
      nodeMap.set(rootEvent.id, {
        id: rootEvent.id,
        label: rootEvent.title,
        kind: 'EVENT',
        typeCode: rootEvent.category,
        typeLabel: rootEvent.category,
        avatarUrl: rootEvent.thumbnailUrl || undefined,
        startYear: rootEvent.startYear,
        endYear: rootEvent.endYear,
        dateText: rootEvent.dateText,
        distance: 0,
      });
    }

    // 2. Thuật toán BFS duyệt đồ thị theo từng bậc (hop)
    let currentFrontier = new Set<string>([nodeId]);
    const visited = new Set<string>([nodeId]);

    for (let currentDepth = 1; currentDepth <= depth; currentDepth++) {
      if (currentFrontier.size === 0) break;

      const frontierArray = Array.from(currentFrontier);

      // Tìm tất cả các quan hệ xuất phát hoặc kết thúc tại các đỉnh trong frontier
      const statements = await this.prisma.historicalStatement.findMany({
        where: {
          OR: [
            { subjectEntityId: { in: frontierArray } },
            { subjectEventId: { in: frontierArray } },
            { objectEntityId: { in: frontierArray } },
            { objectEventId: { in: frontierArray } },
          ],
        },
        include: {
          predicate: true,
          subjectEntity: true,
          subjectEvent: true,
          objectEntity: true,
          objectEvent: true,
        },
        take: STATEMENT_CONSTANTS.MAX_GRAPH_NODES,
      });

      const nextFrontier = new Set<string>();

      for (const stmt of statements) {
        const sourceId = stmt.subjectEntityId || stmt.subjectEventId;
        const targetId = stmt.objectEntityId || stmt.objectEventId;

        // Lưu cạnh (Edge)
        if (sourceId && targetId) {
          edgeMap.set(stmt.id, {
            id: stmt.id,
            source: sourceId,
            target: targetId,
            predicateId: stmt.predicateId,
            predicateCode: stmt.predicate.code,
            predicateLabel: stmt.predicate.label,
            validFromYear: stmt.validFromYear,
            validToYear: stmt.validToYear,
            isPrimary: stmt.isPrimary,
            qualifiers: (stmt.qualifiers as Record<string, any>) || null,
          });

          // Xử lý node nguồn (Source)
          if (!nodeMap.has(sourceId)) {
            if (stmt.subjectEntity) {
              nodeMap.set(sourceId, {
                id: sourceId,
                label: stmt.subjectEntity.name,
                kind: 'ENTITY',
                typeCode: stmt.subjectEntity.type,
                typeLabel: stmt.subjectEntity.type,
                avatarUrl: stmt.subjectEntity.imageUrl || undefined,
                startYear: stmt.subjectEntity.startYear,
                endYear: stmt.subjectEntity.endYear,
                dateText: stmt.subjectEntity.dateText,
                distance: currentDepth,
              });
            } else if (stmt.subjectEvent) {
              nodeMap.set(sourceId, {
                id: sourceId,
                label: stmt.subjectEvent.title,
                kind: 'EVENT',
                typeCode: stmt.subjectEvent.category,
                typeLabel: stmt.subjectEvent.category,
                avatarUrl: stmt.subjectEvent.thumbnailUrl || undefined,
                startYear: stmt.subjectEvent.startYear,
                endYear: stmt.subjectEvent.endYear,
                dateText: stmt.subjectEvent.dateText,
                distance: currentDepth,
              });
            }
          }

          // Xử lý node đích (Target)
          if (!nodeMap.has(targetId)) {
            if (stmt.objectEntity) {
              nodeMap.set(targetId, {
                id: targetId,
                label: stmt.objectEntity.name,
                kind: 'ENTITY',
                typeCode: stmt.objectEntity.type,
                typeLabel: stmt.objectEntity.type,
                avatarUrl: stmt.objectEntity.imageUrl || undefined,
                startYear: stmt.objectEntity.startYear,
                endYear: stmt.objectEntity.endYear,
                dateText: stmt.objectEntity.dateText,
                distance: currentDepth,
              });
            } else if (stmt.objectEvent) {
              nodeMap.set(targetId, {
                id: targetId,
                label: stmt.objectEvent.title,
                kind: 'EVENT',
                typeCode: stmt.objectEvent.category,
                typeLabel: stmt.objectEvent.category,
                avatarUrl: stmt.objectEvent.thumbnailUrl || undefined,
                startYear: stmt.objectEvent.startYear,
                endYear: stmt.objectEvent.endYear,
                dateText: stmt.objectEvent.dateText,
                distance: currentDepth,
              });
            }
          }

          if (!visited.has(sourceId)) {
            visited.add(sourceId);
            nextFrontier.add(sourceId);
          }
          if (!visited.has(targetId)) {
            visited.add(targetId);
            nextFrontier.add(targetId);
          }
        }
      }

      currentFrontier = nextFrontier;
    }

    const nodes = Array.from(nodeMap.values());
    const edges = Array.from(edgeMap.values());

    return {
      rootNodeId: nodeId,
      depth,
      nodes,
      edges,
      totalNodes: nodes.length,
      totalEdges: edges.length,
    };
  }

  /**
   * Lấy câu statement kèm đầy đủ relation
   */
  private async getStatementWithRelations(id: string, tx?: any) {
    const client = tx || this.prisma;
    return client.historicalStatement.findUnique({
      where: { id },
      include: this.getStatementIncludeOptions(),
    });
  }

  /**
   * Cấu hình include cho Prisma queries
   */
  private getStatementIncludeOptions() {
    return {
      predicate: {
        select: {
          id: true,
          code: true,
          label: true,
          inverseLabel: true,
          description: true,
        },
      },
      subjectEntity: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          type: true,
        },
      },
      subjectEvent: {
        select: {
          id: true,
          title: true,
          slug: true,
          dateText: true,
          startYear: true,
          endYear: true,
          category: true,
          thumbnailUrl: true,
        },
      },
      objectEntity: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          type: true,
        },
      },
      objectEvent: {
        select: {
          id: true,
          title: true,
          slug: true,
          dateText: true,
          startYear: true,
          endYear: true,
          category: true,
          thumbnailUrl: true,
        },
      },
      references: {
        include: {
          reference: true,
        },
      },
    };
  }
}
