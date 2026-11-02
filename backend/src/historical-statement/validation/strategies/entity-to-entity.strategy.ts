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

export class EntityToEntityValidationStrategy
  implements IStatementValidationStrategy
{
  readonly name = 'EntityToEntityValidationStrategy';

  canHandle(
    subjectKind: StatementNodeKind,
    objectKind: StatementNodeKind,
  ): boolean {
    return (
      subjectKind === STATEMENT_NODE_KIND.ENTITY &&
      objectKind === STATEMENT_NODE_KIND.ENTITY
    );
  }

  async validate(context: StatementValidationContext): Promise<void> {
    const { payload } = context;

    if (!payload.subjectEntityId) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.SUBJECT_ENTITY_NOT_FOUND,
      );
    }

    if (!payload.objectEntityId) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.OBJECT_ENTITY_NOT_FOUND,
      );
    }

    if (payload.subjectEntityId === payload.objectEntityId) {
      throw new BadRequestException(STATEMENT_ERROR_MESSAGES.NO_SELF_LOOP);
    }
  }
}
