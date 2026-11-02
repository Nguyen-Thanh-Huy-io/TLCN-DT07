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

export class EventToEventValidationStrategy
  implements IStatementValidationStrategy
{
  readonly name = 'EventToEventValidationStrategy';

  canHandle(
    subjectKind: StatementNodeKind,
    objectKind: StatementNodeKind,
  ): boolean {
    return (
      subjectKind === STATEMENT_NODE_KIND.EVENT &&
      objectKind === STATEMENT_NODE_KIND.EVENT
    );
  }

  async validate(context: StatementValidationContext): Promise<void> {
    const { payload } = context;

    if (!payload.subjectEventId) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.SUBJECT_EVENT_NOT_FOUND,
      );
    }

    if (!payload.objectEventId) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.OBJECT_EVENT_NOT_FOUND,
      );
    }

    if (payload.subjectEventId === payload.objectEventId) {
      throw new BadRequestException(STATEMENT_ERROR_MESSAGES.NO_SELF_LOOP);
    }
  }
}
