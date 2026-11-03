import { StatementNodeKind } from '../historical-statement.constant';
import { StatementValueType } from '@prisma/client';

export interface StatementValidationPayload {
  subjectId: string;
  predicateId: string;
  objectId?: string | null;
  objectValue?: any | null;
  objectValueType?: StatementValueType | null;
  validFromYear?: number | null;
  validToYear?: number | null;
}

export interface StatementValidationContext {
  payload: StatementValidationPayload;
  objectKind: StatementNodeKind;
}

export interface IStatementValidationStrategy {
  readonly name: string;
  canHandle(objectKind: StatementNodeKind): boolean;
  validate(context: StatementValidationContext): Promise<void>;
}
