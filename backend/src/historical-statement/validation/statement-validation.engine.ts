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
import { LiteralValidationStrategy } from './strategies/literal.strategy';

@Injectable()
export class StatementValidationEngine {
  private readonly strategies: IStatementValidationStrategy[];

  constructor(private readonly prisma: PrismaService) {
    this.strategies = [
      new EntityToEntityValidationStrategy(),
      new LiteralValidationStrategy(),
    ];
  }

  /**
   * Xác thực toàn bộ ràng buộc nghiệp vụ và tính hợp lệ của phát biểu lịch sử.
   * Subject luôn là 1 HistoricalEntity (Event cũng là Entity, type=EVENT).
   */
  async validateStatement(
    payload: StatementValidationPayload,
    currentStatementId?: string,
  ): Promise<{ objectKind: StatementNodeKind }> {
    if (!payload.subjectId) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.SUBJECT_ENTITY_NOT_FOUND,
      );
    }

    // 1. Kiểm tra chính xác 1 Object
    const hasObjectEntity = Boolean(payload.objectId);
    const hasObjectValue =
      payload.objectValue !== undefined &&
      payload.objectValue !== null &&
      Boolean(payload.objectValueType);

    const objectCount = (hasObjectEntity ? 1 : 0) + (hasObjectValue ? 1 : 0);

    if (objectCount !== 1) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.EXACTLY_ONE_OBJECT,
      );
    }

    const objectKind: StatementNodeKind = hasObjectEntity
      ? STATEMENT_NODE_KIND.ENTITY
      : STATEMENT_NODE_KIND.LITERAL;

    // 2. Ràng buộc thời gian (Không có năm 0, năm kết thúc >= năm bắt đầu)
    this.validateChronology(payload.validFromYear, payload.validToYear);

    // 3. Tìm và kích hoạt Strategy tương ứng
    const strategy = this.strategies.find((s) => s.canHandle(objectKind));

    if (!strategy) {
      throw new BadRequestException('Không tìm thấy chiến lược xác thực phù hợp.');
    }

    await strategy.validate({ payload, objectKind });

    // 4. Kiểm tra sự tồn tại trong DB (Chủ thể, Đối tượng, Predicate)
    await this.validateDatabaseExistence(payload, objectKind);

    // 5. Kiểm tra Predicate có hợp lệ với loại Subject/Object theo TaxonomyPredicateRule
    await this.validatePredicateRule(payload, objectKind);

    // 6. Kiểm tra trùng lặp quan hệ (Duplicate check)
    await this.validateUniqueness(payload, objectKind, currentStatementId);

    return { objectKind };
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
    const subjectExists = await this.prisma.historicalEntity.findUnique({
      where: { id: payload.subjectId },
      select: { id: true },
    });
    if (!subjectExists) {
      throw new NotFoundException(
        STATEMENT_ERROR_MESSAGES.SUBJECT_ENTITY_NOT_FOUND,
      );
    }

    // C. Kiểm tra Object
    if (objectKind === STATEMENT_NODE_KIND.ENTITY && payload.objectId) {
      const exists = await this.prisma.historicalEntity.findUnique({
        where: { id: payload.objectId },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundException(
          STATEMENT_ERROR_MESSAGES.OBJECT_ENTITY_NOT_FOUND,
        );
      }
    }
  }

  /**
   * Kiểm tra loại Subject/Object thực tế (entityType của HistoricalEntity — bao gồm cả
   * EVENT) có khớp allowedSubjectTypes/allowedObjectTypes của TaxonomyPredicateRule.
   */
  private async validatePredicateRule(
    payload: StatementValidationPayload,
    objectKind: StatementNodeKind,
  ): Promise<void> {
    const rule = await this.prisma.taxonomyPredicateRule.findUnique({
      where: { predicateTermId: payload.predicateId },
    });

    // Predicate chưa khai báo rule (ví dụ predicate tự do mới tạo) — bỏ qua, không chặn.
    if (!rule) return;

    const subjectType = await this.resolveNodeType(payload.subjectId);
    if (
      rule.allowedSubjectTypes.length > 0 &&
      subjectType &&
      !rule.allowedSubjectTypes.includes(subjectType)
    ) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.PREDICATE_SUBJECT_TYPE_INVALID,
      );
    }

    if (objectKind === STATEMENT_NODE_KIND.LITERAL) {
      // Literal không có "loại thực thể" để so với allowedObjectTypes.
      return;
    }

    const objectType = await this.resolveNodeType(payload.objectId);
    if (
      rule.allowedObjectTypes.length > 0 &&
      objectType &&
      !rule.allowedObjectTypes.includes(objectType)
    ) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.PREDICATE_OBJECT_TYPE_INVALID,
      );
    }
  }

  /**
   * Trả về mã loại thực tế (entityType) của 1 Entity — EVENT là 1 giá trị bình thường
   * của HistoricalEntityType, không còn cần đặc cách.
   */
  private async resolveNodeType(
    entityId?: string | null,
  ): Promise<string | null> {
    if (!entityId) return null;
    const entity = await this.prisma.historicalEntity.findUnique({
      where: { id: entityId },
      select: { type: true },
    });
    return entity?.type ?? null;
  }

  /**
   * Đảm bảo không trùng phát biểu giữa 2 nút với cùng predicate
   */
  private async validateUniqueness(
    payload: StatementValidationPayload,
    objectKind: StatementNodeKind,
    currentStatementId?: string,
  ): Promise<void> {
    if (objectKind === STATEMENT_NODE_KIND.LITERAL) {
      // Literal cho phép nhiều statement cùng loại
      return;
    }

    const whereClause: any = {
      predicateId: payload.predicateId,
      subjectId: payload.subjectId,
      objectId: payload.objectId,
    };

    if (currentStatementId) {
      whereClause.id = { not: currentStatementId };
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
