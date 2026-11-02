import { Injectable } from '@nestjs/common';
import { formatHistoricalYear } from '../../common/utils/historical-date.parser';
import {
  TIMELINE_DIRECTION,
  TIMELINE_ITEM_TYPE,
  TimelineDirection,
  TimelineItemType,
} from './timeline.constant';
import { PersonTimelineItemDto } from './timeline.dto';

export interface IProjectedStatementPayload {
  targetEntityId: string;
  statement: any;
}

@Injectable()
export class StatementDirectionProjector {
  /**
   * Chiếu một HistoricalStatement sang một PersonTimelineItemDto theo góc nhìn của targetEntity
   */
  project(payload: IProjectedStatementPayload): PersonTimelineItemDto | null {
    const { targetEntityId, statement } = payload;
    const isSubject = statement.subjectEntityId === targetEntityId;
    const isObject = statement.objectEntityId === targetEntityId;

    if (!isSubject && !isObject) {
      return null;
    }

    const predicate = statement.predicate;
    const meta = (predicate?.meta as Record<string, any>) || {};
    const isSymmetric = Boolean(
      meta.isSymmetric || predicate?.code === 'CONTEMPORARY_OF',
    );

    let direction: TimelineDirection = TIMELINE_DIRECTION.OUTGOING;
    let activeLabel = predicate?.label || 'Có quan hệ với';

    if (isSymmetric) {
      direction = TIMELINE_DIRECTION.BIDIRECTIONAL;
      activeLabel = predicate?.label || 'Cùng thời với';
    } else if (isObject) {
      direction = TIMELINE_DIRECTION.INCOMING;
      activeLabel = predicate?.inverseLabel || predicate?.label || 'Liên quan đến';
    }

    const counterpartEvent = isSubject
      ? statement.objectEvent
      : statement.subjectEvent;

    const counterpartEntity = isSubject
      ? statement.objectEntity
      : statement.subjectEntity;

    const qualifiers = (statement.qualifiers as Record<string, any>) || {};
    const role = qualifiers.role || qualifiers.roleCode || null;
    const roleLabel = qualifiers.roleLabel || null;
    const notes = qualifiers.notes || qualifiers.note || null;

    const references = (statement.references || []).map((ref: any) => ({
      id: ref.reference?.id || ref.referenceId,
      title: ref.reference?.title || 'Tư liệu tham khảo',
      author: ref.reference?.author || null,
      pageNumber: ref.pageNumber || null,
      quote: ref.quote || null,
    }));

    // Trường hợp 1: Quan hệ kết nối với Sự kiện (Event Participation)
    if (counterpartEvent) {
      const year = statement.validFromYear ?? counterpartEvent.startYear ?? null;
      const month = counterpartEvent.startMonth ?? null;
      const day = counterpartEvent.startDay ?? null;
      const dateText =
        counterpartEvent.dateText ||
        (year ? formatHistoricalYear(year) : null);

      let title = counterpartEvent.title;
      let description = counterpartEvent.summary || counterpartEvent.description;
      if (notes) {
        description = description ? `${notes}\n\n${description}` : notes;
      }

      return {
        id: `statement-event-${statement.id}`,
        type: TIMELINE_ITEM_TYPE.EVENT_PARTICIPATION,
        title,
        year,
        month,
        day,
        dateText,
        datePrecision: counterpartEvent.datePrecision,
        role,
        roleLabel,
        description,
        direction,
        predicate: {
          id: predicate.id,
          code: predicate.code,
          label: predicate.label,
          inverseLabel: predicate.inverseLabel,
        },
        event: {
          id: counterpartEvent.id,
          title: counterpartEvent.title,
          slug: counterpartEvent.slug,
          category: counterpartEvent.category,
          thumbnailUrl: counterpartEvent.thumbnailUrl,
          dateText: counterpartEvent.dateText,
        },
        references,
        isPrimary: Boolean(statement.isPrimary),
      };
    }

    // Trường hợp 2: Quan hệ với Thực thể khác hoặc Giá trị Literal (General Statement)
    const year = statement.validFromYear ?? null;
    let targetName = counterpartEntity?.name;
    if (!targetName && statement.objectValue) {
      targetName =
        typeof statement.objectValue === 'string'
          ? statement.objectValue
          : JSON.stringify(statement.objectValue);
    }

    const title = targetName
      ? `${activeLabel}: ${targetName}`
      : `${activeLabel}`;

    return {
      id: `statement-${statement.id}`,
      type: TIMELINE_ITEM_TYPE.STATEMENT,
      title,
      year,
      month: null,
      day: null,
      dateText: year ? formatHistoricalYear(year) : null,
      datePrecision: null,
      role,
      roleLabel,
      description: notes,
      direction,
      predicate: {
        id: predicate.id,
        code: predicate.code,
        label: predicate.label,
        inverseLabel: predicate.inverseLabel,
      },
      event: null,
      references,
      isPrimary: Boolean(statement.isPrimary),
    };
  }
}
