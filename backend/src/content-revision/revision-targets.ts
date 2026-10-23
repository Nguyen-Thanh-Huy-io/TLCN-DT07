import { Injectable, NotFoundException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HistoricalEntityService } from '../historical-entity/historical-entity.service';
import { HistoricalEventService } from '../historical-event/historical-event.service';
import { LessonService } from '../lesson/lesson.service';
import {
  REVISION_FIELDS,
  REVISION_MESSAGES,
  RevisionContentType,
} from './content-revision.constant';

type Payload = Record<string, unknown>;
type Detail = Record<string, any>;

/** Cách đọc / ghi một loại nội dung có phiên bản hóa. */
export interface RevisionTarget {
  load(id: string): Promise<Detail>;
  title(detail: Detail): string;
  status(detail: Detail): string;
  /** Nội dung hiện tại → payload (chỉ các trường biên tập được, cùng dạng API cập nhật). */
  toPayload(detail: Detail): Payload;
  /** Áp dụng payload qua service cập nhật thật (giữ nguyên kiểm tra, đồng bộ danh mục, xóa cache). */
  apply(id: string, payload: Payload): Promise<unknown>;
  /** Phủ payload lên chi tiết để form CMS mở đúng bản sửa đang chờ. */
  overlay(detail: Detail, payload: Payload): Detail;
}

/** Chỉ giữ các trường biên tập được của loại nội dung (bỏ status, slug...). */
export function pickFields(type: RevisionContentType, source: Detail): Payload {
  const out: Payload = {};
  for (const { key } of REVISION_FIELDS[type]) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

@Injectable()
export class RevisionTargets {
  constructor(private readonly moduleRef: ModuleRef) {}

  // Lấy service lúc chạy (strict: false) để tránh vòng phụ thuộc module: các module nội dung dùng
  // ContentWrite (guard / interceptor) còn module phiên bản lại cần service của chúng.
  private svc<T>(token: new (...args: any[]) => T): T {
    return this.moduleRef.get(token, { strict: false });
  }

  get(type: RevisionContentType): RevisionTarget {
    const target = this.targets[type];
    if (!target) throw new NotFoundException(REVISION_MESSAGES.UNKNOWN_TYPE(type));
    return target;
  }

  private readonly targets: Record<RevisionContentType, RevisionTarget> = {
    LESSON: {
      load: (id) => this.svc(LessonService).findOne(id),
      title: (d) => d.title,
      status: (d) => d.status,
      toPayload: (d) => pickFields('LESSON', { ...d, content: d.content ?? [] }),
      apply: (id, p) => this.svc(LessonService).update(id, p as any),
      overlay: (d, p) => {
        const merged = { ...d, ...p };
        const content = merged.content ?? [];
        return {
          ...merged,
          // Các alias form bài học đang đọc.
          summary: merged.description || '',
          contentRichText: typeof content === 'string' ? content : JSON.stringify(content),
        };
      },
    },
    EVENT: {
      load: (id) => this.svc(HistoricalEventService).findOne(id) as Promise<Detail>,
      title: (d) => d.title,
      status: (d) => d.status,
      toPayload: (d) =>
        pickFields('EVENT', {
          ...d,
          locationId: d.locationId ?? null,
          entityRelations: (d.entities ?? []).map((e: Detail, i: number) => ({
            entityId: e.entityId,
            role: e.role,
            roleLabel: e.roleLabel ?? null,
            isPrimary: Boolean(e.isPrimary),
            displayOrder: e.displayOrder ?? i,
            notes: e.notes ?? null,
          })),
          media: (d.media ?? []).map((m: Detail, i: number) => ({
            type: m.type,
            url: m.url,
            caption: m.caption ?? null,
            displayOrder: m.displayOrder ?? i + 1,
          })),
        }),
      apply: (id, p) => this.svc(HistoricalEventService).update(id, p as any),
      overlay: (d, p) => {
        const known = new Map((d.entities ?? []).map((e: Detail) => [e.entityId, e]));
        const relations = (p.entityRelations as Detail[] | undefined) ?? undefined;
        return {
          ...d,
          ...p,
          ...(relations
            ? {
                entities: relations.map((r) => ({
                  ...(known.get(r.entityId) ?? {}),
                  ...r,
                })),
              }
            : {}),
        };
      },
    },
    ENTITY: {
      load: (id) => this.svc(HistoricalEntityService).findOne(id) as Promise<Detail>,
      title: (d) => d.name,
      status: (d) => d.status,
      toPayload: (d) => pickFields('ENTITY', d),
      apply: (id, p) => this.svc(HistoricalEntityService).update(id, p as any),
      overlay: (d, p) => ({ ...d, ...p }),
    },
  };
}
