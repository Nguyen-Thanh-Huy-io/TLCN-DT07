import { BadRequestException } from '@nestjs/common';
import { StatementValueType } from '@prisma/client';
import {
  IStatementValidationStrategy,
  StatementValidationContext,
} from '../statement-validation.interface';
import {
  STATEMENT_ERROR_MESSAGES,
  STATEMENT_NODE_KIND,
  StatementNodeKind,
} from '../../historical-statement.constant';

export class LiteralValidationStrategy
  implements IStatementValidationStrategy
{
  readonly name = 'LiteralValidationStrategy';

  canHandle(objectKind: StatementNodeKind): boolean {
    return objectKind === STATEMENT_NODE_KIND.LITERAL;
  }

  async validate(context: StatementValidationContext): Promise<void> {
    const { payload } = context;

    if (payload.objectValue === undefined || payload.objectValue === null) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.EXACTLY_ONE_OBJECT,
      );
    }

    if (!payload.objectValueType) {
      throw new BadRequestException(
        STATEMENT_ERROR_MESSAGES.EXACTLY_ONE_OBJECT,
      );
    }

    switch (payload.objectValueType) {
      case StatementValueType.NUMBER: {
        const num = Number(payload.objectValue);
        if (Number.isNaN(num)) {
          throw new BadRequestException(
            `${STATEMENT_ERROR_MESSAGES.INVALID_LITERAL_VALUE}: Giá trị phải là số hợp lệ.`,
          );
        }
        break;
      }
      case StatementValueType.STRING: {
        if (typeof payload.objectValue !== 'string') {
          throw new BadRequestException(
            `${STATEMENT_ERROR_MESSAGES.INVALID_LITERAL_VALUE}: Giá trị phải là chuỗi văn bản.`,
          );
        }
        break;
      }
      case StatementValueType.DATE: {
        // Date có thể là ISO string hoặc số nguyên năm
        if (
          typeof payload.objectValue !== 'string' &&
          typeof payload.objectValue !== 'number'
        ) {
          throw new BadRequestException(
            `${STATEMENT_ERROR_MESSAGES.INVALID_LITERAL_VALUE}: Ngày tháng phải là chuỗi định dạng hoặc năm.`,
          );
        }
        break;
      }
      case StatementValueType.JSON: {
        if (
          typeof payload.objectValue !== 'object' &&
          !Array.isArray(payload.objectValue)
        ) {
          throw new BadRequestException(
            `${STATEMENT_ERROR_MESSAGES.INVALID_LITERAL_VALUE}: Giá trị phải là Object hoặc Array JSON.`,
          );
        }
        break;
      }
      default:
        break;
    }
  }
}
