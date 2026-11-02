import { StatementNodeKind } from '../historical-statement.constant';
import { StatementValueType } from '@prisma/client';

export interface StatementValidationPayload {
  subjectEntityId?: string | null;
  subjectEventId?: string | null;
  predicateId: string;
  objectEntityId?: string | null;
  objectEventId?: string | null;
  objectValue?: any | null;
  objectValueType?: StatementValueType | null;
  validFromYear?: number | null;
  validToYear?: number | null;
}

export interface StatementValidationContext {
  payload: StatementValidationPayload;
  subjectKind: StatementNodeKind;
  objectKind: StatementNodeKind;
}

export interface IStatementValidationStrategy {
  readonly name: string;
  canHandle(subjectKind: StatementNodeKind, objectKind: StatementNodeKind): boolean;
  validate(context: StatementValidationContext): Promise<void>;
}
