import { BadRequestException } from '@nestjs/common';
import {
  IStatementValidationStrategy,
  StatementValidationContext,
} from '../statement-validation.interface';
import {
  STATEMENT_ERROR_MESSAGES,
  STATEMENT_NODE_KIND,
  StatementNodeKind,
} from '../../historical-statement.constant';

/**
 * Subject luôn là HistoricalEntity (Event nằm trong đó, type=EVENT) — strategy này
 * chỉ còn phân biệt theo Object: Entity hay Literal.
 */
export class EntityToEntityValidationStrategy
  implements IStatementValidationStrategy
{
  readonly name = 'EntityToEntityValidationStrategy';

  canHandle(objectKind: StatementNodeKind): boolean {
    return objectKind === STATEMENT_NODE_KIND.ENTITY;
  }

  async validate(context: StatementValidationContext): Promise<void> {
    const { payload } = context;

    if (!payload.objectId) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.OBJECT_ENTITY_NOT_FOUND,
      );
    }

    if (payload.subjectId === payload.objectId) {
      throw new BadRequestException(STATEMENT_ERROR_MESSAGES.NO_SELF_LOOP);
    }
  }
}
