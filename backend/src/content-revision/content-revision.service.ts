import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentRevision, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import {
  ENTITY_TYPE_LABELS,
  REVISION_CONTENT_TYPES,
  REVISION_FIELDS,
  REVISION_KIND,
  REVISION_MESSAGES,
  REVISION_STATUS,
  RevisionContentType,
} from './content-revision.constant';
import { RevisionTargets, pickFields } from './revision-targets';

type Payload = Record<string, unknown>;

/** So sánh giá trị theo nội dung (thứ tự khóa trong object không quan trọng). */
function stable(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'null';
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export interface RevisionChange {
  key: string;
  label: string;
  kind: string;
  ref?: string;
  before: unknown;
  after: unknown;
}

/** Chỉ các trường khác nhau giữa hai payload — màn hình duyệt chỉ hiện phần thay đổi. */
export function diffPayloads(
  type: RevisionContentType,
  before: Payload,
  after: Payload,
): RevisionChange[] {
  return REVISION_FIELDS[type]
    .filter((f) => f.key in after || f.key in before)
    .filter((f) => stable(before[f.key]) !== stable(after[f.key]))
    .map((f) => ({ ...f, before: before[f.key] ?? null, after: after[f.key] ?? null }));
}

/**
 * Trường biên tập viên thật sự đổi trong bản sửa (so với nội dung lúc bắt đầu sửa); null nếu bản sửa
 * cũ chưa lưu bản gốc — khi đó coi mọi trường là của bản sửa.
 */
function editedKeys(type: RevisionContentType, revision: ContentRevision): string[] | null {
  const base = revision.basePayload as Payload | null;
  if (!base) return null;
  const payload = revision.payload as Payload;
  return REVISION_FIELDS[type]
    .map((f) => f.key)
    .filter((key) => stable(base[key]) !== stable(payload[key]));
}

@Injectable()
export class ContentRevisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly targets: RevisionTargets,
  ) {}

  assertType(type: string): RevisionContentType {
    if (!Object.values(REVISION_CONTENT_TYPES).includes(type as RevisionContentType)) {
      throw new NotFoundException(REVISION_MESSAGES.UNKNOWN_TYPE(type));
    }
    return type as RevisionContentType;
  }

  /** Phiên bản hiện hành = số ảnh chụp đã có + 1 (bản đầu tiên là v1). */
  private async liveVersion(type: RevisionContentType, contentId: string) {
    const snapshots = await this.prisma.contentRevision.count({
      where: { contentType: type, contentId, kind: REVISION_KIND.SNAPSHOT },
    });
    return snapshots + 1;
  }

  private findPending(type: RevisionContentType, contentId: string) {
    return this.prisma.contentRevision.findFirst({
      where: {
        contentType: type,
        contentId,
        kind: REVISION_KIND.PROPOSAL,
        status: REVISION_STATUS.PENDING,
      },
    });
  }

  /**
   * Biên tập viên lưu nội dung đang xuất bản: thay đổi thành bản sửa chờ duyệt (bản công khai giữ
   * nguyên). Đã có bản chờ thì ghi đè — mỗi nội dung tối đa một bản sửa đang mở.
   */
  async propose(type: RevisionContentType, contentId: string, body: Payload, authorId: string) {
    const target = this.targets.get(type);
    const detail = await target.load(contentId);
    // Bản sửa = nội dung hiện tại + phần gửi lên, để so sánh / áp dụng luôn trên đủ trường.
    const live = target.toPayload(detail);
    const payload = { ...live, ...pickFields(type, body) };
    const existing = await this.findPending(type, contentId);
    const data = {
      title: String(payload.title ?? payload.name ?? target.title(detail) ?? '').slice(0, 255),
      payload: payload as Prisma.InputJsonValue,
      authorId,
    };
    const revision = existing
      ? await this.prisma.contentRevision.update({ where: { id: existing.id }, data })
      : await this.prisma.contentRevision.create({
          data: {
            ...data,
            contentType: type,
            contentId,
            kind: REVISION_KIND.PROPOSAL,
            status: REVISION_STATUS.PENDING,
            version: (await this.liveVersion(type, contentId)) + 1,
            // Bản gốc giữ nguyên khi ghi đè bản sửa: luôn là nội dung lúc bắt đầu sửa.
            basePayload: live as Prisma.InputJsonValue,
          },
        });
    return { revisionPending: true, message: REVISION_MESSAGES.PROPOSED, revision };
  }

  /** Chụp nội dung hiện tại vào lịch sử trước khi một thay đổi được áp dụng. */
  async snapshot(type: RevisionContentType, contentId: string, actorId: string | null) {
    const target = this.targets.get(type);
    const detail = await target.load(contentId);
    return this.prisma.contentRevision.create({
      data: {
        contentType: type,
        contentId,
        kind: REVISION_KIND.SNAPSHOT,
        status: REVISION_STATUS.ARCHIVED,
        version: await this.liveVersion(type, contentId),
        title: String(target.title(detail) ?? '').slice(0, 255),
        payload: target.toPayload(detail) as Prisma.InputJsonValue,
        authorId: actorId,
      },
    });
  }

  private async findRevision(id: string) {
    const revision = await this.prisma.contentRevision.findUnique({ where: { id } });
    if (!revision) throw new NotFoundException(REVISION_MESSAGES.NOT_FOUND);
    return revision;
  }

  async approve(id: string, reviewerId: string, note?: string) {
    const revision = await this.findRevision(id);
    if (revision.kind !== REVISION_KIND.PROPOSAL || revision.status !== REVISION_STATUS.PENDING) {
      throw new BadRequestException(REVISION_MESSAGES.NOT_PENDING);
    }
    if (revision.authorId === reviewerId) {
      throw new ForbiddenException(REVISION_MESSAGES.CANNOT_REVIEW_OWN);
    }
    const type = this.assertType(revision.contentType);
    // Chỉ áp dụng trường biên tập viên đã đổi — không ghi đè thay đổi người duyệt làm trong lúc chờ.
    const keys = editedKeys(type, revision);
    const payload = revision.payload as Payload;
    const toApply = keys ? Object.fromEntries(keys.map((k) => [k, payload[k]])) : payload;
    await this.snapshot(type, revision.contentId, reviewerId);
    await this.targets.get(type).apply(revision.contentId, toApply);
    return this.prisma.contentRevision.update({
      where: { id },
      data: {
        status: REVISION_STATUS.APPROVED,
        reviewerId,
        reviewNote: note?.trim() || null,
        reviewedAt: new Date(),
        version: await this.liveVersion(type, revision.contentId),
      },
    });
  }

  async reject(id: string, reviewerId: string, note: string) {
    const revision = await this.findRevision(id);
    if (revision.kind !== REVISION_KIND.PROPOSAL || revision.status !== REVISION_STATUS.PENDING) {
      throw new BadRequestException(REVISION_MESSAGES.NOT_PENDING);
    }
    if (!note?.trim()) throw new BadRequestException(REVISION_MESSAGES.REJECT_NOTE_REQUIRED);
    return this.prisma.contentRevision.update({
      where: { id },
      data: {
        status: REVISION_STATUS.REJECTED,
        reviewerId,
        reviewNote: note.trim(),
        reviewedAt: new Date(),
      },
    });
  }

  /** Khôi phục một phiên bản trong lịch sử (bản hiện tại cũng được chụp lại trước). */
  async restore(id: string, reviewerId: string) {
    const revision = await this.findRevision(id);
    if (revision.kind !== REVISION_KIND.SNAPSHOT) {
      throw new BadRequestException(REVISION_MESSAGES.NOT_SNAPSHOT);
    }
    const type = this.assertType(revision.contentType);
    await this.snapshot(type, revision.contentId, reviewerId);
    await this.targets.get(type).apply(revision.contentId, revision.payload as Payload);
    return { restoredVersion: revision.version };
  }

  /** Chi tiết một phiên bản + các trường khác với nội dung hiện tại. */
  async detail(id: string) {
    const revision = await this.findRevision(id);
    const type = this.assertType(revision.contentType);
    const target = this.targets.get(type);
    const current = target.toPayload(await target.load(revision.contentId));
    const payload = revision.payload as Payload;
    // before = nội dung đang hiện, after = bản sửa (hoặc phiên bản cũ: thấy khôi phục sẽ đổi gì).
    // Bản sửa có bản gốc: chỉ hiện trường biên tập viên đã đổi (đúng phần sẽ được áp dụng).
    const changes = this.proposalChanges(type, revision, current) ?? diffPayloads(type, current, payload);
    return {
      revision: await this.withPeople(revision),
      changes,
      labels: await this.resolveLabels(changes),
    };
  }

  /**
   * Tên hiển thị cho id / mã xuất hiện trong phần so sánh: giai đoạn, chủ đề, thực thể, sự kiện,
   * giá trị danh mục (loại sự kiện, vai trò...), loại thực thể, nhãn trường thông tin riêng.
   */
  private async resolveLabels(changes: RevisionChange[]): Promise<Record<string, string>> {
    const ids: Record<string, Set<string>> = {
      period: new Set(), topic: new Set(), entity: new Set(), event: new Set(), term: new Set(),
    };
    const add = (bucket: string, value: unknown) => {
      for (const v of Array.isArray(value) ? value : [value]) {
        if (typeof v === 'string' && v) ids[bucket]?.add(v);
      }
    };
    const labels: Record<string, string> = {};
    for (const c of changes) {
      for (const side of [c.before, c.after]) {
        if ((c.kind === 'ref' || c.kind === 'refs') && c.ref) {
          if (c.ref === 'entityType') {
            for (const v of [side].flat()) if (typeof v === 'string') labels[v] = ENTITY_TYPE_LABELS[v] ?? v;
          } else add(c.ref, side);
        }
        if (c.kind === 'relations' && Array.isArray(side)) {
          for (const r of side as Payload[]) {
            add('entity', r.entityId);
            add('term', r.role);
          }
        }
      }
    }
    const [periods, topics, entities, events, terms, fieldTerms] = await Promise.all([
      ids.period.size ? this.prisma.period.findMany({ where: { id: { in: [...ids.period] } }, select: { id: true, name: true } }) : [],
      ids.topic.size ? this.prisma.topic.findMany({ where: { id: { in: [...ids.topic] } }, select: { id: true, name: true } }) : [],
      ids.entity.size
        ? this.prisma.historicalEntity.findMany({ where: { id: { in: [...ids.entity] } }, select: { id: true, name: true } })
        : [],
      ids.event.size
        ? this.prisma.historicalEvent.findMany({ where: { id: { in: [...ids.event] } }, select: { id: true, title: true } })
        : [],
      ids.term.size
        ? this.prisma.taxonomyTerm.findMany({
            where: { OR: [{ id: { in: [...ids.term] } }, { code: { in: [...ids.term] } }] },
            select: { id: true, code: true, label: true },
          })
        : [],
      // Nhãn trường thông tin riêng (metadata) khai báo trong danh mục loại sự kiện.
      changes.some((c) => c.kind === 'object')
        ? this.prisma.taxonomyTerm.findMany({ where: { groupCode: 'EVENT_CATEGORY' }, select: { meta: true } })
        : [],
    ]);
    for (const p of periods) labels[p.id] = p.name;
    for (const t of topics) labels[t.id] = t.name;
    for (const e of entities) labels[e.id] = e.name;
    for (const e of events) labels[e.id] = e.title;
    for (const t of terms) {
      labels[t.id] = t.label;
      labels[t.code] ??= t.label;
    }
    for (const t of fieldTerms) {
      const fields = (t.meta as { fields?: Array<{ key: string; label: string }> } | null)?.fields ?? [];
      for (const fd of fields) labels[`field:${fd.key}`] ??= fd.label;
    }
    return labels;
  }

  private proposalChanges(
    type: RevisionContentType,
    revision: ContentRevision,
    current: Payload,
  ): RevisionChange[] | null {
    if (revision.kind !== REVISION_KIND.PROPOSAL) return null;
    const keys = editedKeys(type, revision);
    if (!keys) return null;
    const payload = revision.payload as Payload;
    return REVISION_FIELDS[type]
      .filter((f) => keys.includes(f.key))
      .map((f) => ({ ...f, before: current[f.key] ?? null, after: payload[f.key] ?? null }));
  }

  /** Danh sách bản sửa chờ duyệt (trang Duyệt bài). */
  async pending() {
    const rows = await this.prisma.contentRevision.findMany({
      where: { kind: REVISION_KIND.PROPOSAL, status: REVISION_STATUS.PENDING },
      orderBy: { updatedAt: 'desc' },
    });
    return Promise.all(rows.map((r) => this.withPeople(r)));
  }

  /** Lịch sử của một nội dung: phiên bản hiện hành, các ảnh chụp, các bản sửa đã đề xuất. */
  async history(typeRaw: string, contentId: string) {
    const type = this.assertType(typeRaw);
    const rows = await this.prisma.contentRevision.findMany({
      where: { contentType: type, contentId },
      orderBy: { createdAt: 'desc' },
    });
    const target = this.targets.get(type);
    const live = target.toPayload(await target.load(contentId));
    // Mỗi phiên bản cũ so với phiên bản ngay sau nó (bản mới nhất so với bản đang xuất bản):
    // lần thay đổi đó đã đổi những trường nào — để hiển thị dạng dòng thời gian.
    const snapshots = rows
      .filter((r) => r.kind === REVISION_KIND.SNAPSHOT)
      .sort((a, b) => a.version - b.version);
    const nextOf = new Map(
      snapshots.map((snap, i) => [snap.id, (snapshots[i + 1]?.payload as Payload | undefined) ?? live]),
    );
    const summarize = (r: ContentRevision) => {
      const changes =
        r.kind === REVISION_KIND.SNAPSHOT
          ? diffPayloads(type, r.payload as Payload, nextOf.get(r.id) ?? live)
          : (this.proposalChanges(type, r, r.basePayload as Payload) ??
            diffPayloads(type, live, r.payload as Payload));
      return changes.map((c) => c.label);
    };
    return {
      liveVersion: await this.liveVersion(type, contentId),
      items: await Promise.all(
        rows.map(async (r) => ({ ...(await this.withPeople(r)), changedFields: summarize(r) })),
      ),
    };
  }

  /** Bản sửa đang chờ của nội dung, phủ lên chi tiết để form CMS mở tiếp đúng bản đó. */
  async openDraft(typeRaw: string, contentId: string) {
    const type = this.assertType(typeRaw);
    const pending = await this.findPending(type, contentId);
    if (!pending) return null;
    const target = this.targets.get(type);
    return {
      revision: await this.withPeople(pending),
      draft: target.overlay(await target.load(contentId), pending.payload as Payload),
    };
  }

  private async withPeople(revision: ContentRevision) {
    const ids = [revision.authorId, revision.reviewerId].filter((v): v is string => Boolean(v));
    const users = ids.length
      ? await this.prisma.authUser.findMany({
          where: { id: { in: ids } },
          select: { id: true, username: true, role: true },
        })
      : [];
    const byId = new Map(users.map((u) => [u.id, u]));
    return {
      ...revision,
      author: revision.authorId ? (byId.get(revision.authorId) ?? null) : null,
      reviewer: revision.reviewerId ? (byId.get(revision.reviewerId) ?? null) : null,
    };
  }
}
