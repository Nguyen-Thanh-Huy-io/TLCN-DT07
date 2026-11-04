export class StatementRelationAdapter {
  /**
   * Chuyển đổi các phát biểu HistoricalStatement (subjectStatements/objectStatements) thành
   * cấu trúc quan hệ outgoing/incoming của 1 HistoricalEntity (Event cũng là 1 Entity,
   * type=EVENT, nên không còn phân biệt "quan hệ với Event" riêng — tất cả đều là
   * targetEntity/sourceEntity, phía gọi tự lọc theo entity.type nếu cần).
   */
  static adaptEntity(rawEntity: any): any {
    if (!rawEntity) return rawEntity;

    const subjectStmts: any[] = rawEntity.subjectStatements || [];
    const objectStmts: any[] = rawEntity.objectStatements || [];
    const allStatements = [...subjectStmts, ...objectStmts];

    if (allStatements.length === 0) {
      return {
        ...rawEntity,
        statements: [],
        outgoingRelations: rawEntity.outgoingRelations || [],
        incomingRelations: rawEntity.incomingRelations || [],
      };
    }

    // Quan hệ chiều xuôi: Entity (rawEntity) -> Entity (object)
    const outgoingFromStatements = subjectStmts
      .filter((stmt) => stmt.objectId && stmt.object)
      .map((stmt) => ({
        id: stmt.id,
        sourceEntityId: stmt.subjectId,
        targetEntityId: stmt.objectId,
        relationType: stmt.predicate?.code || 'RELATED_TO',
        relationTypeId: stmt.predicateId,
        relationTypeTerm: stmt.predicate,
        startYear: stmt.validFromYear,
        endYear: stmt.validToYear,
        note: (stmt.qualifiers as any)?.notes || (stmt.qualifiers as any)?.note || null,
        isPrimary: Boolean(stmt.isPrimary),
        qualifiers: stmt.qualifiers || null,
        targetEntity: {
          ...stmt.object,
          birthYear: stmt.object?.person?.birthYear ?? null,
          deathYear: stmt.object?.person?.deathYear ?? null,
        },
        references: stmt.references || [],
        createdAt: stmt.createdAt,
      }));

    // Quan hệ chiều ngược: Entity (subject) -> Entity (rawEntity)
    const incomingFromStatements = objectStmts
      .filter((stmt) => stmt.subjectId && stmt.subject)
      .map((stmt) => ({
        id: stmt.id,
        sourceEntityId: stmt.subjectId,
        targetEntityId: stmt.objectId,
        relationType: stmt.predicate?.code || 'RELATED_TO',
        relationTypeId: stmt.predicateId,
        relationTypeTerm: stmt.predicate,
        startYear: stmt.validFromYear,
        endYear: stmt.validToYear,
        note: (stmt.qualifiers as any)?.notes || (stmt.qualifiers as any)?.note || null,
        isPrimary: Boolean(stmt.isPrimary),
        qualifiers: stmt.qualifiers || null,
        sourceEntity: {
          ...stmt.subject,
          birthYear: stmt.subject?.person?.birthYear ?? null,
          deathYear: stmt.subject?.person?.deathYear ?? null,
        },
        references: stmt.references || [],
        createdAt: stmt.createdAt,
      }));

    return {
      ...rawEntity,
      outgoingRelations: outgoingFromStatements,
      incomingRelations: incomingFromStatements,
      statements: allStatements,
    };
  }
}
