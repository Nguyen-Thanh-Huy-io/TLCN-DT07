import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import {
  STATEMENT_ERROR_MESSAGES,
  STATEMENT_NODE_KIND,
  StatementNodeKind,
} from '../historical-statement.constant';
import {
  IStatementValidationStrategy,
  StatementValidationPayload,
} from './statement-validation.interface';
import { EntityToEntityValidationStrategy } from './strategies/entity-to-entity.strategy';
import { EntityToEventValidationStrategy } from './strategies/entity-to-event.strategy';
import { EventToEventValidationStrategy } from './strategies/event-to-event.strategy';
import { EventToEntityValidationStrategy } from './strategies/event-to-entity.strategy';
import { LiteralValidationStrategy } from './strategies/literal.strategy';

@Injectable()
export class StatementValidationEngine {
  private readonly strategies: IStatementValidationStrategy[];

  constructor(private readonly prisma: PrismaService) {
    this.strategies = [
      new EntityToEntityValidationStrategy(),
      new EntityToEventValidationStrategy(),
      new EventToEventValidationStrategy(),
      new EventToEntityValidationStrategy(),
      new LiteralValidationStrategy(),
    ];
  }

  /**
   * Xác thực toàn bộ ràng buộc nghiệp vụ và tính hợp lệ của phát biểu lịch sử
   */
  async validateStatement(
    payload: StatementValidationPayload,
    currentStatementId?: string,
  ): Promise<{
    subjectKind: StatementNodeKind;
    objectKind: StatementNodeKind;
  }> {
    // 1. Kiểm tra chính xác 1 Subject
    const hasSubjectEntity = Boolean(payload.subjectEntityId);
    const hasSubjectEvent = Boolean(payload.subjectEventId);

    if (
      (!hasSubjectEntity && !hasSubjectEvent) ||
      (hasSubjectEntity && hasSubjectEvent)
    ) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.EXACTLY_ONE_SUBJECT,
      );
    }

    const subjectKind: StatementNodeKind = hasSubjectEntity
      ? STATEMENT_NODE_KIND.ENTITY
      : STATEMENT_NODE_KIND.EVENT;

    // 2. Kiểm tra chính xác 1 Object
    const hasObjectEntity = Boolean(payload.objectEntityId);
    const hasObjectEvent = Boolean(payload.objectEventId);
    const hasObjectValue =
      payload.objectValue !== undefined &&
      payload.objectValue !== null &&
      Boolean(payload.objectValueType);

    const objectCount =
      (hasObjectEntity ? 1 : 0) +
      (hasObjectEvent ? 1 : 0) +
      (hasObjectValue ? 1 : 0);

    if (objectCount !== 1) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.EXACTLY_ONE_OBJECT,
      );
    }

    let objectKind: StatementNodeKind = STATEMENT_NODE_KIND.LITERAL;
    if (hasObjectEntity) {
      objectKind = STATEMENT_NODE_KIND.ENTITY;
    } else if (hasObjectEvent) {
      objectKind = STATEMENT_NODE_KIND.EVENT;
    }

    // 3. Ràng buộc thời gian (Không có năm 0, năm kết thúc >= năm bắt đầu)
    this.validateChronology(payload.validFromYear, payload.validToYear);

    // 4. Tìm và kích hoạt Strategy tương ứng
    const strategy = this.strategies.find((s) =>
      s.canHandle(subjectKind, objectKind),
    );

    if (!strategy) {
      throw new BadRequestException('Không tìm thấy chiến lược xác thực phù hợp.');
    }

    await strategy.validate({ payload, subjectKind, objectKind });

    // 5. Kiểm tra sự tồn tại trong DB (Chủ thể, Đối tượng, Predicate)
    await this.validateDatabaseExistence(payload, subjectKind, objectKind);

    // 6. Kiểm tra trùng lặp quan hệ (Duplicate check)
    await this.validateUniqueness(payload, subjectKind, objectKind, currentStatementId);

    return { subjectKind, objectKind };
  }

  /**
   * Kiểm tra tính hợp lệ của niên đại lịch sử (Quy ước TCN/SCN không năm 0)
   */
  private validateChronology(
    fromYear?: number | null,
    toYear?: number | null,
  ): void {
    if (fromYear === 0 || toYear === 0) {
      throw new BadRequestException(STATEMENT_ERROR_MESSAGES.NO_YEAR_ZERO);
    }

    if (
      fromYear !== undefined &&
      fromYear !== null &&
      toYear !== undefined &&
      toYear !== null &&
      toYear < fromYear
    ) {
      throw new BadRequestException(STATEMENT_ERROR_MESSAGES.INVALID_YEAR_RANGE);
    }
  }

  /**
   * Kiểm tra tính tồn tại của các khoá ngoại
   */
  private async validateDatabaseExistence(
    payload: StatementValidationPayload,
    subjectKind: StatementNodeKind,
    objectKind: StatementNodeKind,
  ): Promise<void> {
    // A. Kiểm tra Predicate Taxonomy Term
    const predicate = await this.prisma.taxonomyTerm.findUnique({
      where: { id: payload.predicateId },
    });

    if (!predicate) {
      throw new NotFoundException(STATEMENT_ERROR_MESSAGES.PREDICATE_NOT_FOUND);
    }

    if (predicate.isActive === false) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.PREDICATE_NOT_ACTIVE,
      );
    }

    // B. Kiểm tra Subject
    if (subjectKind === STATEMENT_NODE_KIND.ENTITY && payload.subjectEntityId) {
      const exists = await this.prisma.historicalEntity.findUnique({
        where: { id: payload.subjectEntityId },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundException(
          STATEMENT_ERROR_MESSAGES.SUBJECT_ENTITY_NOT_FOUND,
        );
      }
    } else if (
      subjectKind === STATEMENT_NODE_KIND.EVENT &&
      payload.subjectEventId
    ) {
      const exists = await this.prisma.historicalEvent.findUnique({
        where: { id: payload.subjectEventId },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundException(
          STATEMENT_ERROR_MESSAGES.SUBJECT_EVENT_NOT_FOUND,
        );
      }
    }

    // C. Kiểm tra Object
    if (objectKind === STATEMENT_NODE_KIND.ENTITY && payload.objectEntityId) {
      const exists = await this.prisma.historicalEntity.findUnique({
        where: { id: payload.objectEntityId },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundException(
          STATEMENT_ERROR_MESSAGES.OBJECT_ENTITY_NOT_FOUND,
        );
      }
    } else if (
      objectKind === STATEMENT_NODE_KIND.EVENT &&
      payload.objectEventId
    ) {
      const exists = await this.prisma.historicalEvent.findUnique({
        where: { id: payload.objectEventId },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundException(
          STATEMENT_ERROR_MESSAGES.OBJECT_EVENT_NOT_FOUND,
        );
      }
    }
  }

  /**
   * Đảm bảo không trùng phát biểu giữa 2 nút với cùng predicate
   */
  private async validateUniqueness(
    payload: StatementValidationPayload,
    subjectKind: StatementNodeKind,
    objectKind: StatementNodeKind,
    currentStatementId?: string,
  ): Promise<void> {
    if (objectKind === STATEMENT_NODE_KIND.LITERAL) {
      // Literal cho phép nhiều statement cùng loại
      return;
    }

    const whereClause: any = {
      predicateId: payload.predicateId,
    };

    if (currentStatementId) {
      whereClause.id = { not: currentStatementId };
    }

    if (subjectKind === STATEMENT_NODE_KIND.ENTITY) {
      whereClause.subjectEntityId = payload.subjectEntityId;
    } else {
      whereClause.subjectEventId = payload.subjectEventId;
    }

    if (objectKind === STATEMENT_NODE_KIND.ENTITY) {
      whereClause.objectEntityId = payload.objectEntityId;
    } else {
      whereClause.objectEventId = payload.objectEventId;
    }

    const duplicate = await this.prisma.historicalStatement.findFirst({
      where: whereClause,
      select: { id: true },
    });

    if (duplicate) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.DUPLICATE_STATEMENT,
      );
    }
  }
}
