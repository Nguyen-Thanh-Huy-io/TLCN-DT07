import { StatementDirectionProjector } from './statement-direction.projector';
import {
  TIMELINE_DIRECTION,
  TIMELINE_ITEM_TYPE,
} from './timeline.constant';

describe('StatementDirectionProjector', () => {
  let projector: StatementDirectionProjector;

  beforeEach(() => {
    projector = new StatementDirectionProjector();
  });

  it('nên chiếu đúng chiều OUTGOING khi Target là Subject tham gia Sự kiện', () => {
    const targetId = 'person-nguyen-trai';
    const statement = {
      id: 'stmt-1',
      subjectId: targetId,
      objectId: 'event-lam-son',
      predicate: {
        id: 'pred-1',
        code: 'PARTICIPATED_IN',
        label: 'Tham gia',
        inverseLabel: 'Có sự tham gia của',
      },
      object: {
        id: 'event-lam-son',
        type: 'EVENT',
        name: 'Khởi nghĩa Lam Sơn',
        slug: 'khoi-nghia-lam-son',
        startYear: 1418,
        startMonth: 2,
        startDay: 7,
        dateText: '1418 - 1427',
        description: 'Khởi nghĩa chống quân Minh',
        event: { categoryIds: ['cat-war'] },
      },
      qualifiers: {
        role: 'MILITARY_ADVISER',
        roleLabel: 'Quân sư mưu lược',
        notes: 'Dâng Bình Ngô sách tại Lỗi Giang',
      },
      references: [
        {
          reference: {
            id: 'ref-1',
            title: 'Đại Việt Sử ký Toàn thư',
            author: 'Ngô Sĩ Liên',
          },
          pageNumber: 'Tập II, tr. 250',
          quote: 'Nguyễn Trãi theo Lê Lợi khởi nghĩa',
        },
      ],
      isPrimary: true,
    };

    const item = projector.project({ targetEntityId: targetId, statement });

    expect(item).not.toBeNull();
    expect(item?.type).toBe(TIMELINE_ITEM_TYPE.EVENT_PARTICIPATION);
    expect(item?.direction).toBe(TIMELINE_DIRECTION.OUTGOING);
    expect(item?.predicate?.label).toBe('Tham gia');
    expect(item?.title).toBe('Khởi nghĩa Lam Sơn');
    expect(item?.year).toBe(1418);
    expect(item?.role).toBe('MILITARY_ADVISER');
    expect(item?.roleLabel).toBe('Quân sư mưu lược');
    expect(item?.description).toContain('Dâng Bình Ngô sách tại Lỗi Giang');
    expect(item?.references?.length).toBe(1);
    expect(item?.references?.[0].title).toBe('Đại Việt Sử ký Toàn thư');
  });

  it('nên chiếu đúng chiều INCOMING và dùng inverseLabel khi Target là Object của quan hệ', () => {
    const targetId = 'person-nguyen-trai';
    const statement = {
      id: 'stmt-2',
      subjectId: 'event-lam-son',
      objectId: targetId,
      predicate: {
        id: 'pred-1',
        code: 'PARTICIPATED_IN',
        label: 'Tham gia',
        inverseLabel: 'Có sự tham gia của',
      },
      subject: {
        id: 'event-lam-son',
        type: 'EVENT',
        name: 'Khởi nghĩa Lam Sơn',
        slug: 'khoi-nghia-lam-son',
        startYear: 1418,
      },
      qualifiers: {
        role: 'MILITARY_ADVISER',
        roleLabel: 'Quân sư',
      },
      isPrimary: true,
    };

    const item = projector.project({ targetEntityId: targetId, statement });

    expect(item).not.toBeNull();
    expect(item?.direction).toBe(TIMELINE_DIRECTION.INCOMING);
    expect(item?.predicate?.inverseLabel).toBe('Có sự tham gia của');
  });

  it('nên nhận diện BIDIRECTIONAL đối với quan hệ đối xứng (vd: CONTEMPORARY_OF)', () => {
    const targetId = 'person-nguyen-trai';
    const statement = {
      id: 'stmt-3',
      subjectId: targetId,
      objectId: 'person-le-loi',
      predicate: {
        id: 'pred-sym',
        code: 'CONTEMPORARY_OF',
        label: 'Cùng thời với',
        inverseLabel: 'Cùng thời với',
        meta: { isSymmetric: true },
      },
      object: {
        id: 'person-le-loi',
        type: 'PERSON',
        name: 'Lê Lợi',
        slug: 'le-loi',
      },
      validFromYear: 1418,
      qualifiers: {
        notes: 'Cùng chung thời kỳ khởi nghĩa Lam Sơn',
      },
    };

    const item = projector.project({ targetEntityId: targetId, statement });

    expect(item).not.toBeNull();
    expect(item?.type).toBe(TIMELINE_ITEM_TYPE.STATEMENT);
    expect(item?.direction).toBe(TIMELINE_DIRECTION.BIDIRECTIONAL);
    expect(item?.title).toBe('Cùng thời với: Lê Lợi');
    expect(item?.year).toBe(1418);
  });

  it('nên trả về null nếu targetEntity không thuộc Subject lẫn Object', () => {
    const statement = {
      id: 'stmt-other',
      subjectId: 'other-1',
      objectId: 'other-2',
      predicate: { id: 'p', code: 'REL', label: 'Rel' },
    };

    const item = projector.project({ targetEntityId: 'unrelated-id', statement });
    expect(item).toBeNull();
  });
});
