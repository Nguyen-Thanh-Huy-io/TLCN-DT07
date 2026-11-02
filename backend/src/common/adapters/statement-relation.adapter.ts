export class StatementRelationAdapter {
  /**
   * Chuyển đổi các phát biểu HistoricalStatement thành cấu trúc quan hệ của Thực thể
   * (Đảm bảo 100% tương thích ngược cho DTO và UI hiện tại)
   */
  static adaptEntity(rawEntity: any): any {
    if (!rawEntity) return rawEntity;

    const subjectStmts: any[] = rawEntity.subjectStatements || [];
    const objectStmts: any[] = rawEntity.objectStatements || [];
    const allStatements = [...subjectStmts, ...objectStmts];
    const hasParticipations = Boolean(rawEntity.eventParticipations && rawEntity.eventParticipations.length > 0);

    // Nếu không có phát biểu nào và không có dữ liệu tham gia mới, giữ nguyên quan hệ gốc
    if (allStatements.length === 0 && !hasParticipations) {
      return {
        ...rawEntity,
        statements: [],
      };
    }

    // 1. Quan hệ Thực thể - Thực thể (Chiều xuôi: Entity -> Entity)
    const outgoingFromStatements = subjectStmts
      .filter((stmt) => stmt.objectEntityId && stmt.objectEntity)
      .map((stmt) => ({
        id: stmt.id,
        sourceEntityId: stmt.subjectEntityId,
        targetEntityId: stmt.objectEntityId,
        relationType: stmt.predicate?.code || 'RELATED_TO',
        relationTypeId: stmt.predicateId,
        relationTypeTerm: stmt.predicate,
        startYear: stmt.validFromYear,
        endYear: stmt.validToYear,
        note: (stmt.qualifiers as any)?.notes || (stmt.qualifiers as any)?.note || null,
        isPrimary: Boolean(stmt.isPrimary),
        targetEntity: {
          ...stmt.objectEntity,
          birthYear: stmt.objectEntity?.person?.birthYear ?? null,
          deathYear: stmt.objectEntity?.person?.deathYear ?? null,
        },
        references: stmt.references || [],
        createdAt: stmt.createdAt,
      }));

    // 2. Quan hệ Thực thể - Thực thể (Chiều ngược: Entity <- Entity)
    const incomingFromStatements = objectStmts
      .filter((stmt) => stmt.subjectEntityId && stmt.subjectEntity)
      .map((stmt) => ({
        id: stmt.id,
        sourceEntityId: stmt.subjectEntityId,
        targetEntityId: stmt.objectEntityId,
        relationType: stmt.predicate?.code || 'RELATED_TO',
        relationTypeId: stmt.predicateId,
        relationTypeTerm: stmt.predicate,
        startYear: stmt.validFromYear,
        endYear: stmt.validToYear,
        note: (stmt.qualifiers as any)?.notes || (stmt.qualifiers as any)?.note || null,
        isPrimary: Boolean(stmt.isPrimary),
        sourceEntity: {
          ...stmt.subjectEntity,
          birthYear: stmt.subjectEntity?.person?.birthYear ?? null,
          deathYear: stmt.subjectEntity?.person?.deathYear ?? null,
        },
        references: stmt.references || [],
        createdAt: stmt.createdAt,
      }));

    // 3. Quan hệ Thực thể - Sự kiện (Event Participations)
    const eventsFromSubject = subjectStmts
      .filter((stmt) => stmt.objectEventId && stmt.objectEvent)
      .map((stmt) => ({
        eventId: stmt.objectEventId,
        entityId: rawEntity.id,
        role: (stmt.qualifiers as any)?.role || (stmt.qualifiers as any)?.roleCode || 'PARTICIPANT',
        roleLabel: (stmt.qualifiers as any)?.roleLabel || null,
        isPrimary: Boolean(stmt.isPrimary),
        displayOrder: stmt.displayOrder ?? 0,
        notes: (stmt.qualifiers as any)?.notes || null,
        event: stmt.objectEvent,
        references: stmt.references || [],
        createdAt: stmt.createdAt,
      }));

    const eventsFromObject = objectStmts
      .filter((stmt) => stmt.subjectEventId && stmt.subjectEvent)
      .map((stmt) => ({
        eventId: stmt.subjectEventId,
        entityId: rawEntity.id,
        role: (stmt.qualifiers as any)?.role || (stmt.qualifiers as any)?.roleCode || 'PARTICIPANT',
        roleLabel: (stmt.qualifiers as any)?.roleLabel || null,
        isPrimary: Boolean(stmt.isPrimary),
        displayOrder: stmt.displayOrder ?? 0,
        notes: (stmt.qualifiers as any)?.notes || null,
        event: stmt.subjectEvent,
        references: stmt.references || [],
        createdAt: stmt.createdAt,
      }));

    const eventsFromStatements = [...eventsFromSubject, ...eventsFromObject];

    // 4. Quan hệ từ bảng chuẩn hóa mới: HistoricalEventParticipant
    const eventsFromParticipations = (rawEntity.eventParticipations || []).map((p: any) => ({
      eventId: p.eventId,
      entityId: rawEntity.id,
      role: p.roleTerm?.code || 'PARTICIPANT',
      roleLabel: p.roleLabelOverride || p.roleTerm?.label || null,
      isPrimary: Boolean(p.isPrimary),
      displayOrder: p.displayOrder ?? 0,
      notes: p.notes || null,
      startYear: p.startYear,
      endYear: p.endYear,
      event: p.event,
      references: p.references || [],
      createdAt: p.createdAt,
    }));

    const resolvedEventEntities =
      eventsFromParticipations.length > 0
        ? eventsFromParticipations
        : eventsFromStatements.length > 0
          ? eventsFromStatements
          : rawEntity.eventEntities || [];

    return {
      ...rawEntity,
      outgoingRelations:
        outgoingFromStatements.length > 0
          ? outgoingFromStatements
          : rawEntity.outgoingRelations || [],
      incomingRelations:
        incomingFromStatements.length > 0
          ? incomingFromStatements
          : rawEntity.incomingRelations || [],
      eventEntities: resolvedEventEntities,
      eventParticipations: rawEntity.eventParticipations || [],
      statements: allStatements,
    };
  }

  /**
   * Chuyển đổi các phát biểu HistoricalStatement thành cấu trúc quan hệ của Sự kiện
   * (Đảm bảo 100% tương thích ngược cho DTO và UI hiện tại)
   */
  static adaptEvent(rawEvent: any): any {
    if (!rawEvent) return rawEvent;

    const subjectStmts: any[] = rawEvent.subjectStatements || [];
    const objectStmts: any[] = rawEvent.objectStatements || [];
    const allStatements = [...subjectStmts, ...objectStmts];
    const hasParticipants = Boolean(rawEvent.participants && rawEvent.participants.length > 0);

    if (allStatements.length === 0 && !hasParticipants) {
      return {
        ...rawEvent,
        statements: [],
      };
    }

    // 1. Thực thể tham gia sự kiện (Entities participating in event)
    const entitiesFromObject = subjectStmts
      .filter((stmt) => stmt.objectEntityId && stmt.objectEntity)
      .map((stmt) => ({
        eventId: rawEvent.id,
        entityId: stmt.objectEntityId,
        role: (stmt.qualifiers as any)?.role || (stmt.qualifiers as any)?.roleCode || 'PARTICIPANT',
        roleLabel: (stmt.qualifiers as any)?.roleLabel || null,
        isPrimary: Boolean(stmt.isPrimary),
        displayOrder: stmt.displayOrder ?? 0,
        notes: (stmt.qualifiers as any)?.notes || null,
        entity: stmt.objectEntity,
        references: stmt.references || [],
        createdAt: stmt.createdAt,
      }));

    const entitiesFromSubject = objectStmts
      .filter((stmt) => stmt.subjectEntityId && stmt.subjectEntity)
      .map((stmt) => ({
        eventId: rawEvent.id,
        entityId: stmt.subjectEntityId,
        role: (stmt.qualifiers as any)?.role || (stmt.qualifiers as any)?.roleCode || 'PARTICIPANT',
        roleLabel: (stmt.qualifiers as any)?.roleLabel || null,
        isPrimary: Boolean(stmt.isPrimary),
        displayOrder: stmt.displayOrder ?? 0,
        notes: (stmt.qualifiers as any)?.notes || null,
        entity: stmt.subjectEntity,
        references: stmt.references || [],
        createdAt: stmt.createdAt,
      }));

    const entitiesFromStatements = [...entitiesFromObject, ...entitiesFromSubject];

    // 2. Thực thể từ bảng chuẩn hóa mới: HistoricalEventParticipant
    const entitiesFromParticipants = (rawEvent.participants || []).map((p: any) => ({
      eventId: rawEvent.id,
      entityId: p.entityId,
      role: p.roleTerm?.code || 'PARTICIPANT',
      roleLabel: p.roleLabelOverride || p.roleTerm?.label || null,
      isPrimary: Boolean(p.isPrimary),
      displayOrder: p.displayOrder ?? 0,
      notes: p.notes || null,
      startYear: p.startYear,
      endYear: p.endYear,
      entity: p.entity,
      references: p.references || [],
      createdAt: p.createdAt,
    }));

    const resolvedEntities =
      entitiesFromParticipants.length > 0
        ? entitiesFromParticipants
        : entitiesFromStatements.length > 0
          ? entitiesFromStatements
          : rawEvent.entities || [];

    // 3. Quan hệ Sự kiện - Sự kiện (Chiều xuôi: Event -> Event)
    const outgoingFromStatements = subjectStmts
      .filter((stmt) => stmt.objectEventId && stmt.objectEvent)
      .map((stmt) => ({
        id: stmt.id,
        sourceEventId: stmt.subjectEventId,
        targetEventId: stmt.objectEventId,
        relationType: stmt.predicate?.code || 'CAUSES',
        relationTypeId: stmt.predicateId,
        description: (stmt.qualifiers as any)?.notes || null,
        status: stmt.verificationStatus || 'VERIFIED',
        sourceReference: stmt.references?.[0]?.reference?.title || null,
        targetEvent: stmt.objectEvent,
        references: stmt.references || [],
        createdAt: stmt.createdAt,
      }));

    // 3. Quan hệ Sự kiện - Sự kiện (Chiều ngược: Event <- Event)
    const incomingFromStatements = objectStmts
      .filter((stmt) => stmt.subjectEventId && stmt.subjectEvent)
      .map((stmt) => ({
        id: stmt.id,
        sourceEventId: stmt.subjectEventId,
        targetEventId: stmt.objectEventId,
        relationType: stmt.predicate?.code || 'CAUSES',
        relationTypeId: stmt.predicateId,
        description: (stmt.qualifiers as any)?.notes || null,
        status: stmt.verificationStatus || 'VERIFIED',
        sourceReference: stmt.references?.[0]?.reference?.title || null,
        sourceEvent: stmt.subjectEvent,
        references: stmt.references || [],
        createdAt: stmt.createdAt,
      }));

    return {
      ...rawEvent,
      entities: resolvedEntities,
      participants: rawEvent.participants || [],
      outgoingRelations:
        outgoingFromStatements.length > 0
          ? outgoingFromStatements
          : rawEvent.outgoingRelations || [],
      incomingRelations:
        incomingFromStatements.length > 0
          ? incomingFromStatements
          : rawEvent.incomingRelations || [],
      statements: allStatements,
    };
  }
}
