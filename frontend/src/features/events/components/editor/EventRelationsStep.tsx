'use client';

import React, { useState } from 'react';
import {
  KnowledgeRelationManager,
  type KnowledgeRelationItem,
  KnowledgeRelationType,
} from '@/components/common/KnowledgeRelationManager';
import {
  EventEntityRoles,
  type EventEntityRoleValue,
} from '../EventEntityRoles';
import { EventCausalRelationModal } from './EventCausalRelationModal';
import type {
  OtherEventOption,
  EventCausalRelationItem,
  IncomingEventRelationItem,
  EntityOption,
} from './editor.types';
import type { TaxonomyGroupItem } from '@/services/entities/taxonomy.service';
import {
  EVENT_RELATION_TYPE_LABELS,
  VERIFICATION_STATUS_LABELS,
  VerificationStatus,
} from '@/constants/enums';
import { relationLabel } from '@/features/taxonomy/taxonomy-labels';

export interface EventRelationsStepProps {
  currentEventId?: string;
  relationGroup?: TaxonomyGroupItem;
  roleGroup?: TaxonomyGroupItem;

  // Quan hệ nhân quả Sự kiện <-> Sự kiện
  eventRelations: EventCausalRelationItem[];
  incomingEventRelations: IncomingEventRelationItem[];
  otherEvents: OtherEventOption[];
  onAddEventRelation: (relation: {
    targetEventId: string;
    relationType: string;
    description?: string;
    status: VerificationStatus;
    sourceReference?: string;
  }) => void;
  onRemoveEventRelation: (relId?: string, targetId?: string) => void;

  // Thực thể & Bối cảnh (Thời kỳ, Nhân vật, Lực lượng, Hiện vật)
  availableKnowledgeItems: KnowledgeRelationItem[];
  linkedKnowledgeItems: KnowledgeRelationItem[];
  onAddKnowledgeItems: (items: KnowledgeRelationItem[]) => void;
  onRemoveKnowledgeItem: (id: string) => void;

  // Vai trò thực thể
  entities: EntityOption[];
  selectedEntityIds: string[];
  parentId: string;
  entityRoles: Record<string, EventEntityRoleValue>;
  onEntityRolesChange: (roles: Record<string, EventEntityRoleValue>) => void;
}

export function EventRelationsStep({
  currentEventId,
  relationGroup,
  roleGroup,
  eventRelations,
  incomingEventRelations,
  otherEvents,
  onAddEventRelation,
  onRemoveEventRelation,
  availableKnowledgeItems,
  linkedKnowledgeItems,
  onAddKnowledgeItems,
  onRemoveKnowledgeItem,
  entities,
  selectedEntityIds,
  parentId,
  entityRoles,
  onEntityRolesChange,
}: EventRelationsStepProps) {
  const [isCausalModalOpen, setIsCausalModalOpen] = useState(false);

  // Chỉ cho phép các tab thực thể bối cảnh: BỎ TAB 'EVENT' và 'LOCATION' ĐỂ TRÁNH TRÙNG LẶP THEO GÓP Ý
  const allowedEntityTabs = [
    KnowledgeRelationType.ALL,
    KnowledgeRelationType.PERIOD,
    KnowledgeRelationType.PERSON,
    KnowledgeRelationType.FORCE,
    KnowledgeRelationType.ARTIFACT,
    KnowledgeRelationType.TOPIC,
  ];

  return (
    <div className="space-y-8">
      {/* KHỐI 1: Đồ thị quan hệ nhân quả giữa các sự kiện */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Đồ thị nhân quả giữa các Sự kiện ({eventRelations.length})
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mô hình hóa chuỗi nguyên nhân, tiền đề và hệ quả lịch sử liên kết giữa các sự kiện.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCausalModalOpen(true)}
            className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>+</span>
            <span>Thêm quan hệ nhân quả</span>
          </button>
        </div>

        {/* Danh sách các quan hệ nhân quả đã thiết lập */}
        {eventRelations.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
            <div className="px-3.5 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider grid grid-cols-12 gap-2">
              <span className="col-span-5">Sự kiện liên kết</span>
              <span className="col-span-3">Mối quan hệ</span>
              <span className="col-span-3">Xác minh / Chú thích</span>
              <span className="col-span-1 text-right">Hủy</span>
            </div>
            {eventRelations.map((rel, idx) => {
              const target =
                rel.targetEvent ||
                otherEvents.find((e) => e.id === rel.targetEventId);
              return (
                <div
                  key={rel.id || `${rel.targetEventId}-${idx}`}
                  className="px-3.5 py-2.5 text-xs grid grid-cols-12 gap-2 items-center hover:bg-slate-50/50 transition"
                >
                  <div className="col-span-5 font-semibold text-slate-900 flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <span className="truncate">
                      {target?.title || rel.targetEventId}
                    </span>
                    {target?.startYear && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({target.startYear})
                      </span>
                    )}
                  </div>
                  <div className="col-span-3 text-indigo-700 font-medium">
                    {relationLabel(
                      relationGroup?.terms ?? [],
                      rel.relationType,
                      'OUTGOING',
                      EVENT_RELATION_TYPE_LABELS,
                    )}
                  </div>
                  <div className="col-span-3 text-slate-600 text-[11px] truncate">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 mr-1.5">
                      {VERIFICATION_STATUS_LABELS[
                        rel.status as VerificationStatus
                      ] || rel.status}
                    </span>
                    {rel.description ||
                      (rel.sourceReference
                        ? `Nguồn: ${rel.sourceReference}`
                        : '—')}
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        onRemoveEventRelation(rel.id, rel.targetEventId)
                      }
                      className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                      title="Hủy liên kết"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-slate-50/60 border border-dashed border-slate-200 rounded-xl text-center">
            <p className="text-xs text-slate-500">
              Chưa có quan hệ nhân quả nào được thiết lập.
            </p>
            <button
              type="button"
              onClick={() => setIsCausalModalOpen(true)}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
            >
              + Bấm vào đây để thêm quan hệ giữa các sự kiện
            </button>
          </div>
        )}

        {/* Các quan hệ chiều ngược đến sự kiện này (Incoming relations) */}
        {incomingEventRelations.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              Được liên kết từ các sự kiện khác ({incomingEventRelations.length}):
            </span>
            <div className="space-y-1">
              {incomingEventRelations.map((inc) => (
                <div
                  key={inc.id}
                  className="text-xs px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-slate-600"
                >
                  <span>
                    <b className="text-slate-800">
                      {inc.sourceEvent?.title || inc.sourceEventId}
                    </b>{' '}
                    →{' '}
                    {relationLabel(
                      relationGroup?.terms ?? [],
                      inc.relationType,
                      'OUTGOING',
                      EVENT_RELATION_TYPE_LABELS,
                    )}{' '}
                    → Sự kiện này
                  </span>
                  {inc.description && (
                    <span className="text-[11px] text-slate-400 italic">
                      {inc.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KHỐI 2: Thực thể & Bối cảnh (Nhân vật, Thời kỳ, Lực lượng, Hiện vật) */}
      <div className="pt-4 border-t border-slate-200 space-y-4">
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
            Bối cảnh & Thực thể Lịch sử liên quan
          </span>
          <p className="text-xs text-slate-500">
            Gắn kết sự kiện vào Thời kỳ lịch sử, các Nhân vật tiêu biểu, Lực lượng tham gia và Hiện vật/Vũ khí liên quan.
          </p>
        </div>

        <KnowledgeRelationManager
          availableItems={availableKnowledgeItems}
          linkedItems={linkedKnowledgeItems}
          onAddItems={onAddKnowledgeItems}
          onRemoveItem={onRemoveKnowledgeItem}
          allowedTabs={allowedEntityTabs}
        />

        <EventEntityRoles
          group={roleGroup}
          entities={selectedEntityIds
            .filter((id) => id !== parentId)
            .map((id) => entities.find((e) => e.id === id))
            .filter((e): e is NonNullable<typeof e> => Boolean(e))}
          roles={entityRoles}
          onChange={onEntityRolesChange}
        />
      </div>

      {/* Modal tạo liên kết nhân quả */}
      <EventCausalRelationModal
        isOpen={isCausalModalOpen}
        onClose={() => setIsCausalModalOpen(false)}
        otherEvents={otherEvents}
        currentEventId={currentEventId}
        relationGroup={relationGroup}
        onAddRelation={onAddEventRelation}
      />
    </div>
  );
}
