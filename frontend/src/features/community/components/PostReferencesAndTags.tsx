'use client';

import React from 'react';
import type { CommunityReferenceItem } from '../api';

interface PostReferencesAndTagsProps {
  references: CommunityReferenceItem[];
  tags: string[];
  activeTag?: string | null;
  onSelectTag?: (tag: string) => void;
}

export function PostReferencesAndTags({
  references,
  tags,
  activeTag,
  onSelectTag,
}: PostReferencesAndTagsProps) {
  return (
    <>
      {references.length > 0 ? (
        <div className="mt-4 rounded-[8px] border border-[#E2D5BC] bg-[#F2E8D5] px-4 py-2.5 text-[13px] text-[#4A3F33]">
          <span className="font-semibold text-[#8A5A19]">Sử liệu đối chiếu: </span>
          <span>
            {references
              .map((ref) => (ref.source ? `${ref.title} (${ref.source})` : ref.title))
              .join(' · ')}
          </span>
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {tags.map((tag) => {
            const isSelected = activeTag?.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectTag?.(tag)}
                className={`h-7 rounded-[6px] border px-2.5 text-[13px] font-medium transition-colors ${
                  isSelected
                    ? 'border-[#7A1F24] bg-[#7A1F24] text-[#FAF5E6]'
                    : 'border-[#E2D5BC] bg-[#F3EAD8] text-[#5C4E3C] hover:border-[#8A5A19] hover:text-[#14233F]'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
