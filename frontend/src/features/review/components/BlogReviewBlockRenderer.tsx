'use client';

import React from 'react';
import Image from 'next/image';
import { resolveBackendAssetUrl } from '@/constants/api-url';
import { BLOCK_TYPE_IMAGE, BORDER_LIGHT } from '../constants/review.constant';
import type { ContentBlockData } from '../types/review.types';

interface BlogReviewBlockRendererProps {
  blocks?: ContentBlockData[];
  defaultTitle: string;
  fallbackSummary?: string;
}

const renderParagraphs = (value: string) =>
  (value || '')
    .split(/\n{2,}|\r\n\r\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/\r\n/g, '\n'));

export function BlogReviewBlockRenderer({
  blocks,
  defaultTitle,
  fallbackSummary,
}: BlogReviewBlockRendererProps) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return (
      <div style={{ color: '#58646d', lineHeight: 1.8, fontSize: 18 }}>
        {fallbackSummary || 'Bài viết này chưa có nội dung chi tiết để hiển thị ở chế độ xem trước.'}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {blocks.map((block: ContentBlockData, blockIndex: number) => {
        const type = block?.type || block?.kind || 'paragraph';
        const heading = typeof block?.heading === 'string' ? block.heading : '';
        const text = typeof block?.text === 'string' ? block.text : '';
        const caption = typeof block?.caption === 'string' ? block.caption : '';
        const imageUrl = typeof block?.imageUrl === 'string' ? block.imageUrl : '';

        if (type === BLOCK_TYPE_IMAGE && imageUrl) {
          return (
            <figure
              key={`${imageUrl}-${blockIndex}`}
              style={{ margin: 0, display: 'grid', gap: 10 }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 400,
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: BORDER_LIGHT,
                }}
              >
                <Image
                  src={resolveBackendAssetUrl(imageUrl)}
                  alt={caption || defaultTitle}
                  fill
                  unoptimized
                  style={{ objectFit: 'cover' }}
                />
              </div>
              {caption ? (
                <figcaption
                  style={{
                    textAlign: 'center',
                    color: '#58646d',
                    fontSize: 14,
                    fontStyle: 'italic',
                  }}
                >
                  {caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        const paragraphs = renderParagraphs(text || 'Đoạn văn sẽ xuất hiện ở đây.');

        return (
          <div key={`${type}-${blockIndex}`} style={{ display: 'grid', gap: 12 }}>
            {heading ? (
              <h3
                style={{
                  margin: 0,
                  fontSize: 26,
                  lineHeight: 1.1,
                  color: '#1f2a37',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                }}
              >
                {heading}
              </h3>
            ) : null}
            {paragraphs.map((paragraph, paragraphIndex) => (
              <p
                key={`${block?.id || blockIndex}-paragraph-${paragraphIndex}`}
                style={{ margin: 0, fontSize: 18, lineHeight: 1.9, color: '#2f3c3d' }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}
