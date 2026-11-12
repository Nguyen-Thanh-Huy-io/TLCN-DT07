'use client';

import React from 'react';
import { BORDER_LIGHT } from '../constants/review.constant';
import type { ArticleReferenceData } from '../types/review.types';

interface BlogReviewReferencesProps {
  references: ArticleReferenceData[];
}

export function BlogReviewReferences({ references }: BlogReviewReferencesProps) {
  const validRefs = references.filter((ref) => ref?.title || ref?.source || ref?.url);
  if (validRefs.length === 0) return null;

  return (
    <div style={{ borderTop: BORDER_LIGHT, paddingTop: 18, display: 'grid', gap: 12 }}>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#7d5d3d',
          fontWeight: 700,
        }}
      >
        Tài liệu tham khảo
      </p>
      <ul
        style={{
          margin: 0,
          paddingLeft: 20,
          display: 'grid',
          gap: 8,
          color: '#2f3c3d',
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        {validRefs.map((reference, index) => (
          <li key={`${reference?.title || reference?.source || index}`}>
            {reference?.url ? (
              <a
                href={reference.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#1f2a37',
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                }}
              >
                {reference.title || 'Nguồn tham khảo'}
              </a>
            ) : (
              <span>{reference?.title || 'Nguồn tham khảo'}</span>
            )}
            {reference?.source ? (
              <span style={{ color: '#58646d' }}> — {reference.source}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
