import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ContentRevisionService, diffPayloads } from './content-revision.service';
import { RevisionTargets } from './revision-targets';

/** Bảng content_revisions giả trong bộ nhớ, đủ cho các truy vấn service dùng. */
function fakePrisma() {
  const rows: any[] = [];
  let seq = 0;
  const match = (r: any, where: any = {}) => Object.entries(where).every(([k, v]) => r[k] === v);
  return {
    rows,
    contentRevision: {
      count: jest.fn(async ({ where }) => rows.filter((r) => match(r, where)).length),
      findFirst: jest.fn(async ({ where }) => rows.find((r) => match(r, where)) ?? null),
      findUnique: jest.fn(async ({ where }) => rows.find((r) => r.id === where.id) ?? null),
      findMany: jest.fn(async ({ where }) => rows.filter((r) => match(r, where))),
      create: jest.fn(async ({ data }) => {
        const row = { id: `rev-${++seq}`, reviewerId: null, ...data };
        rows.push(row);
        return row;
      }),
      update: jest.fn(async ({ where, data }) => {
        const row = rows.find((r) => r.id === where.id);
        Object.assign(row, data);
        return row;
      }),
    },
    authUser: { findMany: jest.fn(async () => []) },
  };
}

describe('ContentRevisionService', () => {
  let live: Record<string, any>;
  let prisma: ReturnType<typeof fakePrisma>;
  let apply: jest.Mock;
  let service: ContentRevisionService;

  beforeEach(() => {
    live = { title: 'Trận Bạch Đằng', summary: 'Ngô Quyền đánh tan quân Nam Hán', status: 'PUBLISHED' };
    prisma = fakePrisma();
    apply = jest.fn(async (_id: string, payload: Record<string, any>) => Object.assign(live, payload));
    const target = {
      load: jest.fn(async () => ({ ...live })),
      title: (d: any) => d.title,
      status: (d: any) => d.status,
      toPayload: (d: any) => ({ title: d.title, summary: d.summary }),
      apply,
      overlay: (d: any, p: any) => ({ ...d, ...p }),
    };
    const targets = { get: () => target } as unknown as RevisionTargets;
    service = new ContentRevisionService(prisma as any, targets);
  });

  it('biên tập viên sửa nội dung đang xuất bản: lưu bản sửa, bản công khai giữ nguyên', async () => {
    const res = await service.propose('EVENT', 'ev-1', { summary: 'Bản sửa', status: 'DRAFT' }, 'editor');

    expect(res.revisionPending).toBe(true);
    expect(res.revision).toMatchObject({ kind: 'PROPOSAL', status: 'PENDING', version: 2 });
    // status không nằm trong bản sửa; các trường khác lấy từ bản hiện tại.
    expect(res.revision.payload).toEqual({ title: 'Trận Bạch Đằng', summary: 'Bản sửa' });
    expect(live.summary).toBe('Ngô Quyền đánh tan quân Nam Hán');
    expect(apply).not.toHaveBeenCalled();
  });

  it('sửa tiếp khi đã có bản chờ thì ghi đè đúng bản đó (tối đa một bản mở)', async () => {
    const first = await service.propose('EVENT', 'ev-1', { summary: 'Lần 1' }, 'editor');
    const second = await service.propose('EVENT', 'ev-1', { summary: 'Lần 2' }, 'editor-2');

    expect(second.revision.id).toBe(first.revision.id);
    expect(prisma.rows.filter((r) => r.kind === 'PROPOSAL')).toHaveLength(1);
    expect(second.revision).toMatchObject({ authorId: 'editor-2', payload: { summary: 'Lần 2' } });
  });

  it('duyệt: chụp bản cũ vào lịch sử rồi áp dụng bản sửa', async () => {
    const { revision } = await service.propose('EVENT', 'ev-1', { summary: 'Bản sửa' }, 'editor');

    const approved = await service.approve(revision.id, 'reviewer');

    expect(apply).toHaveBeenCalledWith('ev-1', { title: 'Trận Bạch Đằng', summary: 'Bản sửa' });
    expect(live.summary).toBe('Bản sửa');
    const snapshot = prisma.rows.find((r) => r.kind === 'SNAPSHOT');
    expect(snapshot).toMatchObject({ version: 1, payload: { summary: 'Ngô Quyền đánh tan quân Nam Hán' } });
    expect(approved).toMatchObject({ status: 'APPROVED', reviewerId: 'reviewer', version: 2 });
  });

  it('không được tự duyệt bản sửa của chính mình', async () => {
    const { revision } = await service.propose('EVENT', 'ev-1', { summary: 'x' }, 'same-user');
    await expect(service.approve(revision.id, 'same-user')).rejects.toThrow(ForbiddenException);
  });

  it('từ chối bắt buộc có lý do và không đụng nội dung', async () => {
    const { revision } = await service.propose('EVENT', 'ev-1', { summary: 'x' }, 'editor');
    await expect(service.reject(revision.id, 'reviewer', '  ')).rejects.toThrow(BadRequestException);

    const rejected = await service.reject(revision.id, 'reviewer', 'Thiếu nguồn');
    expect(rejected).toMatchObject({ status: 'REJECTED', reviewNote: 'Thiếu nguồn' });
    expect(apply).not.toHaveBeenCalled();
  });

  it('khôi phục phiên bản cũ: bản hiện tại cũng được chụp lại trước', async () => {
    const { revision } = await service.propose('EVENT', 'ev-1', { summary: 'Bản sửa' }, 'editor');
    await service.approve(revision.id, 'reviewer');
    const v1 = prisma.rows.find((r) => r.kind === 'SNAPSHOT' && r.version === 1);

    const res = await service.restore(v1.id, 'reviewer');

    expect(res.restoredVersion).toBe(1);
    expect(live.summary).toBe('Ngô Quyền đánh tan quân Nam Hán');
    expect(prisma.rows.filter((r) => r.kind === 'SNAPSHOT').map((r) => r.version)).toEqual([1, 2]);
  });

  it('khác biệt chỉ gồm trường đổi (thứ tự khóa trong object không tính là đổi)', () => {
    const changes = diffPayloads(
      'EVENT',
      { title: 'A', metadata: { a: 1, b: 2 }, categoryIds: ['x'] },
      { title: 'A', metadata: { b: 2, a: 1 }, categoryIds: ['x', 'y'] },
    );
    expect(changes.map((c) => c.key)).toEqual(['categoryIds']);
    expect(changes[0]).toMatchObject({ label: 'Loại sự kiện', before: ['x'], after: ['x', 'y'] });
  });
});
