'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Share2 } from 'lucide-react';
import { PublicEntityStatementDto } from '@/services/entities/landing.service';

interface EntityKnowledgeGraphProps {
  statements: PublicEntityStatementDto[];
}

function resolveEntityHref(type: string | null, slug: string | null): string {
  if (!slug) return '#';
  // Luôn dẫn tới trang Universal Entity Reader với đầy đủ Block Builder & Focus Mode
  return `/thuc-the/${slug}`;
}

export const EntityKnowledgeGraph: React.FC<EntityKnowledgeGraphProps> = ({
  statements,
}) => {
  if (!statements || statements.length === 0) return null;

  return (
    <section className="ue-kg-section" id="mang-luoi-tri-thuc">
      <div className="flex items-center gap-2 mb-2">
        <Share2 size={22} className="text-[#8C2D19]" />
        <h2 className="ue-kg-title m-0">Mạng lưới Liên kết Tri thức</h2>
      </div>
      <p className="ue-kg-desc">
        Các mối liên hệ nhân – quả, quan hệ phả hệ, quyền lực và không gian lịch sử được kết nối trong đồ thị tri thức:
      </p>

      <div className="ue-kg-grid">
        {statements.map((stmt) => {
          const href = resolveEntityHref(stmt.relatedEntityType, stmt.relatedEntitySlug);
          const targetName = stmt.relatedEntityName || 'Thực thể liên quan';
          const badgeText = stmt.roleLabel || stmt.predicateLabel;

          return (
            <Link key={stmt.id} href={href} className="ue-kg-card group">
              <div>
                <span className="ue-kg-badge">{badgeText}</span>
                <h3 className="ue-kg-target group-hover:text-[#8C2D19] transition-colors flex items-center justify-between">
                  <span>{targetName}</span>
                  <ArrowUpRight size={16} className="text-stone-400 group-hover:text-[#8C2D19] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </h3>
                {stmt.note && <p className="ue-kg-note">{stmt.note}</p>}
              </div>

              {(stmt.validFromYear != null || stmt.validToYear != null) && (
                <div className="text-xs text-stone-500 font-semibold mt-3 pt-2 border-t border-stone-200">
                  Thời gian: {stmt.validFromYear ?? '...'} – {stmt.validToYear ?? '...'}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
};
