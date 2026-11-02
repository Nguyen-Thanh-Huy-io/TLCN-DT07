import { StatementRelationAdapter } from './statement-relation.adapter';

describe('StatementRelationAdapter', () => {
  describe('adaptEntity', () => {
    it('nên trả về nguyên bản nếu rawEntity null hoặc rỗng', () => {
      expect(StatementRelationAdapter.adaptEntity(null)).toBeNull();
    });

    it('nên fallback về quan hệ cũ khi statements rỗng', () => {
      const mockRaw = {
        id: 'ent-1',
        name: 'Nguyễn Trãi',
        outgoingRelations: [{ id: 'rel-1', targetEntityId: 'ent-2' }],
        subjectStatements: [],
        objectStatements: [],
      };

      const result = StatementRelationAdapter.adaptEntity(mockRaw);
      expect(result.outgoingRelations.length).toBe(1);
      expect(result.statements).toEqual([]);
    });

    it('nên chuyển đổi subjectStatements & objectStatements sang outgoingRelations, incomingRelations, eventEntities chuẩn xác', () => {
      const rawEntity = {
        id: 'ent-nguyen-trai',
        name: 'Nguyễn Trãi',
        subjectStatements: [
          // 1. Quan hệ với Entity khác (Lê Lợi)
          {
            id: 'stmt-1',
            subjectEntityId: 'ent-nguyen-trai',
            objectEntityId: 'ent-le-loi',
            predicate: { code: 'ADVISED', label: 'Cố vấn cho' },
            validFromYear: 1420,
            validToYear: 1428,
            qualifiers: { notes: 'Dâng Bình Ngô sách' },
            objectEntity: {
              id: 'ent-le-loi',
              name: 'Lê Lợi',
              person: { birthYear: 1385, deathYear: 1433 },
            },
            isPrimary: true,
          },
          // 2. Tham gia Sự kiện Lam Sơn
          {
            id: 'stmt-2',
            subjectEntityId: 'ent-nguyen-trai',
            objectEventId: 'event-lam-son',
            predicate: { code: 'PARTICIPATED_IN', label: 'Tham gia' },
            qualifiers: { role: 'MILITARY_ADVISER', roleLabel: 'Quân sư mưu lược' },
            objectEvent: {
              id: 'event-lam-son',
              title: 'Khởi nghĩa Lam Sơn',
              startYear: 1418,
            },
            isPrimary: true,
            displayOrder: 1,
          },
        ],
        objectStatements: [
          // 3. Quan hệ người khác phụng sự/liên kết với Nguyễn Trãi
          {
            id: 'stmt-3',
            subjectEntityId: 'ent-nguyen-xi',
            objectEntityId: 'ent-nguyen-trai',
            predicate: { code: 'ALLIED_WITH', label: 'Đồng minh với' },
            qualifiers: { note: 'Cùng phụng sự triều Hậu Lê' },
            subjectEntity: {
              id: 'ent-nguyen-xi',
              name: 'Nguyễn Xí',
              person: { birthYear: 1397, deathYear: 1465 },
            },
          },
        ],
      };

      const result = StatementRelationAdapter.adaptEntity(rawEntity);

      // Kiểm tra outgoingRelations
      expect(result.outgoingRelations.length).toBe(1);
      expect(result.outgoingRelations[0].targetEntityId).toBe('ent-le-loi');
      expect(result.outgoingRelations[0].relationType).toBe('ADVISED');
      expect(result.outgoingRelations[0].targetEntity.name).toBe('Lê Lợi');
      expect(result.outgoingRelations[0].note).toBe('Dâng Bình Ngô sách');

      // Kiểm tra incomingRelations
      expect(result.incomingRelations.length).toBe(1);
      expect(result.incomingRelations[0].sourceEntityId).toBe('ent-nguyen-xi');
      expect(result.incomingRelations[0].relationType).toBe('ALLIED_WITH');
      expect(result.incomingRelations[0].sourceEntity.name).toBe('Nguyễn Xí');

      // Kiểm tra eventEntities
      expect(result.eventEntities.length).toBe(1);
      expect(result.eventEntities[0].eventId).toBe('event-lam-son');
      expect(result.eventEntities[0].role).toBe('MILITARY_ADVISER');
      expect(result.eventEntities[0].roleLabel).toBe('Quân sư mưu lược');
      expect(result.eventEntities[0].event.title).toBe('Khởi nghĩa Lam Sơn');

      // Kiểm tra statements tổng
      expect(result.statements.length).toBe(3);
    });
  });

  describe('adaptEvent', () => {
    it('nên trả về nguyên bản nếu rawEvent null hoặc rỗng', () => {
      expect(StatementRelationAdapter.adaptEvent(null)).toBeNull();
    });

    it('nên chuyển đổi Statements của Sự kiện sang entities, outgoingRelations, incomingRelations', () => {
      const rawEvent = {
        id: 'event-lam-son',
        title: 'Khởi nghĩa Lam Sơn',
        subjectStatements: [
          // Sự kiện kết nối với Sự kiện tiếp nối (Hội thề Đông Quan)
          {
            id: 'stmt-ev-1',
            subjectEventId: 'event-lam-son',
            objectEventId: 'event-dong-quan',
            predicate: { code: 'CAUSES' },
            verificationStatus: 'VERIFIED',
            objectEvent: {
              id: 'event-dong-quan',
              title: 'Hội thề Đông Quan',
              startYear: 1427,
            },
          },
        ],
        objectStatements: [
          // Nhân vật tham gia sự kiện (Nguyễn Trãi tham gia Lam Sơn)
          {
            id: 'stmt-part-1',
            subjectEntityId: 'ent-nguyen-trai',
            objectEventId: 'event-lam-son',
            predicate: { code: 'PARTICIPATED_IN' },
            qualifiers: { role: 'STRATEGIST', roleLabel: 'Quân sư' },
            subjectEntity: {
              id: 'ent-nguyen-trai',
              name: 'Nguyễn Trãi',
              slug: 'nguyen-trai',
              type: 'PERSON',
            },
            isPrimary: true,
          },
        ],
      };

      const result = StatementRelationAdapter.adaptEvent(rawEvent);

      // Kiểm tra entities tham gia
      expect(result.entities.length).toBe(1);
      expect(result.entities[0].entityId).toBe('ent-nguyen-trai');
      expect(result.entities[0].role).toBe('STRATEGIST');
      expect(result.entities[0].roleLabel).toBe('Quân sư');
      expect(result.entities[0].entity.name).toBe('Nguyễn Trãi');

      // Kiểm tra quan hệ sự kiện
      expect(result.outgoingRelations.length).toBe(1);
      expect(result.outgoingRelations[0].targetEventId).toBe('event-dong-quan');
      expect(result.outgoingRelations[0].relationType).toBe('CAUSES');
      expect(result.outgoingRelations[0].targetEvent.title).toBe('Hội thề Đông Quan');

      expect(result.statements.length).toBe(2);
    });
  });
});
