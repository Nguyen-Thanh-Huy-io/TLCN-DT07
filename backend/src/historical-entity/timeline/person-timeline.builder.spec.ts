import { HistoricalEntityType } from '@prisma/client';
import { PersonTimelineBuilder } from './person-timeline.builder';
import {
  TIMELINE_DIRECTION,
  TIMELINE_ITEM_TYPE,
  TIMELINE_SORT_ORDER,
} from './timeline.constant';
import { PersonTimelineItemDto } from './timeline.dto';

describe('PersonTimelineBuilder', () => {
  let builder: PersonTimelineBuilder;

  beforeEach(() => {
    builder = new PersonTimelineBuilder();
  });

  it('nên khởi tạo builder và reset trạng thái chính xác', () => {
    builder.setEntity({ id: 'e1', name: 'Nguyễn Trãi', type: HistoricalEntityType.PERSON });
    builder.addItem({
      id: 'item-1',
      type: TIMELINE_ITEM_TYPE.EVENT_PARTICIPATION,
      title: 'Khởi nghĩa Lam Sơn',
      year: 1418,
      isPrimary: true,
    });

    expect(builder.build().items.length).toBe(1);

    builder.reset();
    expect(builder.build().items.length).toBe(0);
    expect(builder.build().entityId).toBe('');
  });

  it('nên thêm mốc sinh ra và qua đời cho Person chuẩn xác', () => {
    const entity = {
      id: 'person-1',
      name: 'Nguyễn Trãi',
      slug: 'nguyen-trai',
      type: HistoricalEntityType.PERSON,
    };
    const person = {
      birthYear: 1380,
      birthMonth: null,
      birthDay: null,
      birthDateText: '1380',
      birthDateLabel: 'Sinh tại Thăng Long',
      deathYear: 1442,
      deathMonth: 9,
      deathDay: 19,
      deathDateText: '19/09/1442',
      deathDateLabel: 'Vụ án Lệ Chi Viên',
    };

    builder.setEntity(entity, person);
    builder.addBirthOrFoundingMilestone();
    builder.addDeathOrDissolutionMilestone();

    const result = builder.build(TIMELINE_SORT_ORDER.ASC);

    expect(result.totalMilestones).toBe(2);
    expect(result.items[0].type).toBe(TIMELINE_ITEM_TYPE.BIRTH);
    expect(result.items[0].year).toBe(1380);
    expect(result.items[0].description).toBe('Sinh tại Thăng Long');

    expect(result.items[1].type).toBe(TIMELINE_ITEM_TYPE.DEATH);
    expect(result.items[1].year).toBe(1442);
    expect(result.items[1].month).toBe(9);
    expect(result.items[1].day).toBe(19);
  });

  it('nên sắp xếp niên đại thiên văn chính xác từ TCN đến SCN', () => {
    const entity = {
      id: 'adv-1',
      name: 'An Dương Vương',
      type: HistoricalEntityType.PERSON,
    };

    builder.setEntity(entity);

    // Mốc 1: Năm 208 TCN (kết thúc)
    builder.addItem({
      id: 'm1',
      type: TIMELINE_ITEM_TYPE.EVENT_PARTICIPATION,
      title: 'Kháng chiến chống Triệu Đà thất bại',
      year: -208,
      isPrimary: true,
    });

    // Mốc 2: Năm 257 TCN (lập nước Âu Lạc)
    builder.addItem({
      id: 'm2',
      type: TIMELINE_ITEM_TYPE.EVENT_PARTICIPATION,
      title: 'Đánh bại vua Hùng, thành lập Âu Lạc',
      year: -257,
      isPrimary: true,
    });

    // Mốc 3: Năm 40 SCN (Hai Bà Trưng)
    builder.addItem({
      id: 'm3',
      type: TIMELINE_ITEM_TYPE.STATEMENT,
      title: 'Hậu thế tưởng niệm',
      year: 40,
      isPrimary: false,
    });

    const result = builder.build(TIMELINE_SORT_ORDER.ASC);

    expect(result.items.map((i) => i.year)).toEqual([-257, -208, 40]);
  });

  it('nên ưu tiên mốc Sinh trước Sự kiện và mốc Qua đời sau cùng khi cùng năm', () => {
    const entity = {
      id: 'p-1',
      name: 'Nhân vật thử nghiệm',
      type: HistoricalEntityType.PERSON,
    };
    const person = {
      birthYear: 1400,
      deathYear: 1400,
    };

    builder.setEntity(entity, person);
    builder.addBirthOrFoundingMilestone();
    builder.addItem({
      id: 'event-same-year',
      type: TIMELINE_ITEM_TYPE.EVENT_PARTICIPATION,
      title: 'Sự kiện trong năm sinh',
      year: 1400,
      isPrimary: true,
    });
    builder.addDeathOrDissolutionMilestone();

    const result = builder.build(TIMELINE_SORT_ORDER.ASC);

    expect(result.items[0].type).toBe(TIMELINE_ITEM_TYPE.BIRTH);
    expect(result.items[1].type).toBe(TIMELINE_ITEM_TYPE.EVENT_PARTICIPATION);
    expect(result.items[2].type).toBe(TIMELINE_ITEM_TYPE.DEATH);
  });

  it('nên đảo ngược danh sách khi yêu cầu sắp xếp DESC', () => {
    const entity = { id: 'p-1', name: 'Test', type: HistoricalEntityType.PERSON };
    builder.setEntity(entity);
    builder.addItem({ id: '1', type: TIMELINE_ITEM_TYPE.EVENT_PARTICIPATION, title: 'E1', year: 1000, isPrimary: true });
    builder.addItem({ id: '2', type: TIMELINE_ITEM_TYPE.EVENT_PARTICIPATION, title: 'E2', year: 1200, isPrimary: true });

    const descResult = builder.build(TIMELINE_SORT_ORDER.DESC);
    expect(descResult.items.map((i) => i.year)).toEqual([1200, 1000]);
  });

  it('nên hỗ trợ mốc Thành lập và Kết thúc cho thực thể không phải Person (Tổ chức / Triều đại)', () => {
    const dynastyEntity = {
      id: 'dynasty-ly',
      name: 'Nhà Lý',
      type: HistoricalEntityType.DYNASTY,
      startYear: 1009,
      endYear: 1225,
      dateText: '1009 - 1225',
    };

    builder.setEntity(dynastyEntity);
    builder.addBirthOrFoundingMilestone();
    builder.addDeathOrDissolutionMilestone();

    const result = builder.build();
    expect(result.items.length).toBe(2);
    expect(result.items[0].type).toBe(TIMELINE_ITEM_TYPE.FOUNDING);
    expect(result.items[0].year).toBe(1009);
    expect(result.items[1].type).toBe(TIMELINE_ITEM_TYPE.DISSOLUTION);
    expect(result.items[1].year).toBe(1225);
  });

  it('nên tích hợp HistoricalEventParticipant với đầy đủ vai trò, sự kiện và tài liệu dẫn chứng', () => {
    const entity = {
      id: 'entity-tran-hung-dao',
      name: 'Trần Hưng Đạo',
      type: HistoricalEntityType.PERSON,
    };
    builder.setEntity(entity);

    const participant = {
      id: 'part-1',
      eventId: 'event-bach-dang',
      entityId: 'entity-tran-hung-dao',
      roleLabelOverride: 'Tiết chế Quốc công',
      startYear: 1288,
      endYear: 1288,
      isPrimary: true,
      notes: 'Trực tiếp chỉ huy đại thắng Bạch Đằng tiêu diệt thủy quân Nguyên Mông',
      roleTerm: {
        code: 'COMMANDER',
        label: 'Chỉ huy',
      },
      event: {
        id: 'event-bach-dang',
        title: 'Trận Bạch Đằng (1288)',
        slug: 'tran-bach-dang-1288',
        startYear: 1288,
        thumbnailUrl: 'https://example.com/bach-dang.jpg',
      },
      references: [
        {
          reference: {
            id: 'ref-dtsvlk',
            title: 'Đại Việt Sử Ký Toàn Thư',
            author: 'Ngô Sĩ Liên',
          },
          pageNumber: 'Tập 2, tr. 62',
        },
      ],
    };

    builder.addEventParticipant(participant);
    const result = builder.build();

    expect(result.items.length).toBe(1);
    const item = result.items[0];
    expect(item.type).toBe(TIMELINE_ITEM_TYPE.EVENT_PARTICIPATION);
    expect(item.title).toBe('Tiết chế Quốc công: Trận Bạch Đằng (1288)');
    expect(item.year).toBe(1288);
    expect(item.isPrimary).toBe(true);
    expect(item.event?.title).toBe('Trận Bạch Đằng (1288)');
    expect(item.references?.length).toBe(1);
    expect(item.references?.[0].title).toBe('Đại Việt Sử Ký Toàn Thư');
  });
});
