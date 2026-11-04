'use client';

import { ENTITY_RELATION_TYPE_LABELS } from '@/constants/enums';
import { relationLabel as taxonomyRelationLabel, relationOptions } from '@/features/taxonomy/taxonomy-labels';
import type { TaxonomyTermItem } from '@/services/entities/taxonomy.service';
import { HistoricalEntityItem } from '@/types/models/historical-entity.type';
import {
  KnowledgeRelationManager,
  KnowledgeRelationItem,
} from '@/components/common/KnowledgeRelationManager';
import type { RelationDraft } from '../entity-editor.constants';

export interface EntityRelationsStepProps {
  availableKnowledgeItems: KnowledgeRelationItem[];
  linkedKnowledgeItems: KnowledgeRelationItem[];
  onAddKnowledgeItems: (items: KnowledgeRelationItem[]) => void;
  onRemoveKnowledgeItem: (id: string) => void;

  relations: RelationDraft[];
  relationTerms: TaxonomyTermItem[];
  allEntities: HistoricalEntityItem[];
  onUpdateRelation: (index: number, patch: Partial<RelationDraft>) => void;
  onRemoveRelation: (index: number) => void;

  incomingRelations: any[];
}

/** Bước 3 — Quan hệ & Bối cảnh: thêm liên kết qua khung Tri thức, tinh chỉnh loại quan hệ/niên đại/ghi chú bên dưới. */
export function EntityRelationsStep({
  availableKnowledgeItems,
  linkedKnowledgeItems,
  onAddKnowledgeItems,
  onRemoveKnowledgeItem,
  relations,
  relationTerms,
  allEntities,
  onUpdateRelation,
  onRemoveRelation,
  incomingRelations,
}: EntityRelationsStepProps) {
  return (
    <div className="space-y-6">
      {/* Cụm 1: Khối Quản lý Quan hệ Tri thức chuẩn (KnowledgeRelationManager) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Liên kết Thực thể & Bối cảnh (Nhân vật, Địa điểm, Sự kiện — Thời kỳ chọn ở Mục 1)
          </span>
          <span className="text-[11px] text-slate-400">
            Đồ thị tri thức & Mạng lưới quan hệ ({linkedKnowledgeItems.length})
          </span>
        </div>

        <KnowledgeRelationManager
          availableItems={availableKnowledgeItems}
          linkedItems={linkedKnowledgeItems}
          onAddItems={onAddKnowledgeItems}
          onRemoveItem={onRemoveKnowledgeItem}
        />
      </div>

      {/* Cụm 2: Tinh chỉnh quan hệ thực thể-thực thể đã gắn ở Cụm 1 (loại quan hệ chính xác + niên đại/ghi chú).
          Không còn form thêm riêng — thêm liên kết chỉ qua bảng Tri thức ở Cụm 1; cụm này chỉ để tinh chỉnh. */}
      {relations.length > 0 && (
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Tinh chỉnh quan hệ thực thể (loại quan hệ chính xác, niên đại, ghi chú)
            </span>
            <span className="text-[11px] text-slate-400">{relations.length} liên kết</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
            <div className="px-3.5 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider grid grid-cols-12 gap-2">
              <span className="col-span-3">Thực thể liên kết</span>
              <span className="col-span-3">Mối quan hệ</span>
              <span className="col-span-2">Từ năm — Đến năm</span>
              <span className="col-span-3">Ghi chú ngữ cảnh</span>
              <span className="col-span-1 text-right">Xóa</span>
            </div>
            {relations.map((rel, idx) => {
              const target = allEntities.find((e) => e.id === rel.targetEntityId);
              return (
                <div
                  key={`${rel.targetEntityId}-${idx}`}
                  className="px-3.5 py-2 text-xs grid grid-cols-12 gap-2 items-center hover:bg-slate-50/50 transition"
                >
                  <div className="col-span-3 font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="truncate">{target?.name || rel.targetEntityId}</span>
                  </div>
                  <div className="col-span-3">
                    <select
                      value={rel.relationType}
                      onChange={(e) => onUpdateRelation(idx, { relationType: e.target.value })}
                      className="w-full text-xs font-medium px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                    >
                      {relationOptions(relationTerms, ENTITY_RELATION_TYPE_LABELS, rel.relationType).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <input
                      type="number"
                      value={rel.startYear ?? ''}
                      onChange={(e) =>
                        onUpdateRelation(idx, { startYear: e.target.value ? Number(e.target.value) : undefined })
                      }
                      placeholder="Từ"
                      className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                    />
                    <input
                      type="number"
                      value={rel.endYear ?? ''}
                      onChange={(e) =>
                        onUpdateRelation(idx, { endYear: e.target.value ? Number(e.target.value) : undefined })
                      }
                      placeholder="Đến"
                      className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={rel.note ?? ''}
                      onChange={(e) => onUpdateRelation(idx, { note: e.target.value || undefined })}
                      placeholder="Vd: Tổng chỉ huy kháng chiến lần 2 và 3..."
                      className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => onRemoveRelation(idx)}
                      className="text-slate-400 hover:text-rose-600 font-bold px-1"
                      title="Xóa liên kết"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Quan hệ nhận được (Incoming) nếu có */}
        {incomingRelations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-600 block mb-2">
              Quan hệ hướng tới thực thể này (Incoming Relations)
            </span>
            <div className="text-xs text-slate-500 space-y-1">
              {incomingRelations.map((inc) => (
                <div key={inc.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                  <span>
                    <strong className="text-slate-800">{inc.sourceEntity?.name || inc.sourceEntityId}</strong>{' '}
                    — <em>{taxonomyRelationLabel(relationTerms, inc.relationType, 'INCOMING', ENTITY_RELATION_TYPE_LABELS)}</em>
                  </span>
                  <span className="text-[11px] text-slate-400">{inc.note || ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
