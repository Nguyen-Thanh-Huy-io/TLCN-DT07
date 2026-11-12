'use client';

import React from 'react';
import Image from 'next/image';
import { resolveBackendAssetUrl } from '@/constants/api-url';
import type { BlogPostItem } from '@/services/entities/blog.service';
import { extractMetadataFromBlocks } from '@/features/blog/utils/blog-metadata.util';
import { BORDER_LIGHT } from '../constants/review.constant';
import type { ArticleReferenceData, ContentBlockData, ReviewPost } from '../types/review.types';
import { BlogReviewBlockRenderer } from './BlogReviewBlockRenderer';
import { BlogReviewReferences } from './BlogReviewReferences';

interface BlogReviewPreviewModalProps {
  selectedItem: ReviewPost | null;
  previewArticle: BlogPostItem | null;
  onClose: () => void;
  onApprove: (item: ReviewPost) => void;
  onReject: (item: ReviewPost) => void;
}

const stripHtml = (value?: string | null) =>
  (value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const renderParagraphs = (value: string) =>
  (value || '')
    .split(/\n{2,}|\r\n\r\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/\r\n/g, '\n'));

export function BlogReviewPreviewModal({
  selectedItem,
  previewArticle,
  onClose,
  onApprove,
  onReject,
}: BlogReviewPreviewModalProps) {
  if (!selectedItem || !previewArticle) return null;

  const metadata = extractMetadataFromBlocks(previewArticle.contentBlocks);
  const tags = metadata.tags;
  const references = metadata.references as ArticleReferenceData[];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.38)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 40,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1120,
          maxHeight: '88vh',
          overflowY: 'auto',
          background: '#fffdf9',
          border: BORDER_LIGHT,
          borderRadius: 24,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            padding: '18px 22px',
            borderBottom: BORDER_LIGHT,
            background: '#f7f3ee',
            position: 'sticky',
            top: 0,
            zIndex: 2,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#7d5d3d',
                fontWeight: 700,
              }}
            >
              Xem trước bài viết
            </div>
            <h3
              style={{
                margin: '8px 0 0',
                fontSize: 24,
                lineHeight: 1.2,
                color: '#1f2a37',
                fontWeight: 800,
              }}
            >
              {selectedItem.title}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onApprove(selectedItem)}
              style={{
                border: 'none',
                borderRadius: 999,
                background: '#2d3a3f',
                color: '#fff',
                fontWeight: 700,
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Duyệt
            </button>
            <button
              type="button"
              onClick={() => onReject(selectedItem)}
              style={{
                border: '1px solid #e3b9b2',
                borderRadius: 999,
                background: '#f8e3e0',
                color: '#8d3d34',
                fontWeight: 600,
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Từ chối
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                border: '1px solid #d7dce2',
                borderRadius: 999,
                background: '#f5f6f7',
                color: '#4a4d52',
                padding: '10px 12px',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Đóng
            </button>
          </div>
        </div>

        <div style={{ padding: '24px 22px 32px' }}>
          <article style={{ display: 'grid', gap: 24 }}>
            {previewArticle.coverImageUrl && (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 320,
                  overflow: 'hidden',
                  borderRadius: 20,
                  border: BORDER_LIGHT,
                  background: '#f4f2ee',
                }}
              >
                <Image
                  src={resolveBackendAssetUrl(previewArticle.coverImageUrl)}
                  alt={previewArticle.title}
                  fill
                  unoptimized
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}

            {tags.filter(Boolean).length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tags
                  .filter(Boolean)
                  .map((tag: string, index: number) => (
                    <span
                      key={`${tag}-${index}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 999,
                        border: BORDER_LIGHT,
                        background: '#f7f5f2',
                        padding: '7px 10px',
                        fontSize: 11,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: '#6d5635',
                        fontWeight: 700,
                      }}
                    >
                      #{tag.replace(/^#/, '')}
                    </span>
                  ))}
              </div>
            ) : null}

            {(previewArticle.excerpt || selectedItem.summary) ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {renderParagraphs(
                  stripHtml(previewArticle.excerpt || selectedItem.summary || '') ||
                    'Tóm tắt ngắn sẽ hiển thị ở đây.',
                ).map((paragraph, index) => (
                  <p
                    key={`excerpt-${index}`}
                    style={{ margin: 0, fontSize: 18, lineHeight: 1.9, color: '#34414d' }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}

            <BlogReviewBlockRenderer
              blocks={previewArticle.contentBlocks as ContentBlockData[] | undefined}
              defaultTitle={previewArticle.title}
              fallbackSummary={previewArticle.excerpt || selectedItem.summary}
            />

            <BlogReviewReferences references={references} />
          </article>
        </div>
      </div>
    </div>
  );
}
