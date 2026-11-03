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

    it('nên chuyển đổi subjectStatements & objectStatements sang outgoingRelations/incomingRelations chuẩn xác (Event cũng là Entity, type=EVENT)', () => {
      const rawEntity = {
        id: 'ent-nguyen-trai',
        name: 'Nguyễn Trãi',
        subjectStatements: [
          // 1. Quan hệ với Entity khác (Lê Lợi)
          {
            id: 'stmt-1',
            subjectId: 'ent-nguyen-trai',
            objectId: 'ent-le-loi',
            predicate: { code: 'ADVISED', label: 'Cố vấn cho' },
            validFromYear: 1420,
            validToYear: 1428,
            qualifiers: { notes: 'Dâng Bình Ngô sách' },
            object: {
              id: 'ent-le-loi',
              name: 'Lê Lợi',
              type: 'PERSON',
              person: { birthYear: 1385, deathYear: 1433 },
            },
            isPrimary: true,
          },
          // 2. Tham gia Sự kiện Lam Sơn (Event là 1 Entity, type=EVENT)
          {
            id: 'stmt-2',
            subjectId: 'ent-nguyen-trai',
            objectId: 'event-lam-son',
            predicate: { code: 'PARTICIPATED_IN', label: 'Tham gia' },
            qualifiers: { role: 'MILITARY_ADVISER', roleLabel: 'Quân sư mưu lược' },
            object: {
              id: 'event-lam-son',
              name: 'Khởi nghĩa Lam Sơn',
              type: 'EVENT',
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
            subjectId: 'ent-nguyen-xi',
            objectId: 'ent-nguyen-trai',
            predicate: { code: 'ALLIED_WITH', label: 'Đồng minh với' },
            qualifiers: { note: 'Cùng phụng sự triều Hậu Lê' },
            subject: {
              id: 'ent-nguyen-xi',
              name: 'Nguyễn Xí',
              type: 'PERSON',
              person: { birthYear: 1397, deathYear: 1465 },
            },
          },
        ],
      };

      const result = StatementRelationAdapter.adaptEntity(rawEntity);

      // Kiểm tra outgoingRelations (gồm cả quan hệ với Event, vì Event cũng là Entity)
      expect(result.outgoingRelations.length).toBe(2);
      expect(result.outgoingRelations[0].targetEntityId).toBe('ent-le-loi');
      expect(result.outgoingRelations[0].relationType).toBe('ADVISED');
      expect(result.outgoingRelations[0].targetEntity.name).toBe('Lê Lợi');
      expect(result.outgoingRelations[0].note).toBe('Dâng Bình Ngô sách');

      const eventRelation = result.outgoingRelations.find(
        (r: any) => r.targetEntityId === 'event-lam-son',
      );
      expect(eventRelation.targetEntity.type).toBe('EVENT');
      expect(eventRelation.targetEntity.name).toBe('Khởi nghĩa Lam Sơn');

      // Kiểm tra incomingRelations
      expect(result.incomingRelations.length).toBe(1);
      expect(result.incomingRelations[0].sourceEntityId).toBe('ent-nguyen-xi');
      expect(result.incomingRelations[0].relationType).toBe('ALLIED_WITH');
      expect(result.incomingRelations[0].sourceEntity.name).toBe('Nguyễn Xí');

      // Kiểm tra statements tổng
      expect(result.statements.length).toBe(3);
    });
  });
});
