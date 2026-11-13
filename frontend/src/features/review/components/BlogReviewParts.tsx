'use client';

import { useState } from 'react';
import Image from 'next/image';
import { resolveBackendAssetUrl } from '@/constants/api-url';
import { BLOCK_TYPE_IMAGE, BORDER_LIGHT } from '../types/review.types';
import { type ContentBlockData, type ArticleReferenceData, type ReviewConfirmAction, type ReviewPost } from '../types/review.types';
import { ContentStatus } from '@/constants/enums';
import { type BlogPostItem } from '@/services/entities/blog.service';
import { extractMetadataFromBlocks } from '@/features/blog/utils/blog-metadata.util';

// --- BlogReviewBlockRenderer.tsx ---
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

// --- BlogReviewReferences.tsx ---
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

// --- BlogReviewConfirmModal.tsx ---
interface BlogReviewConfirmModalProps {
  confirmAction: ReviewConfirmAction | null;
  onClose: () => void;
  onConfirm: (
    item: ReviewPost,
    type: ContentStatus.PUBLISHED | ContentStatus.REJECTED,
    reason?: string,
  ) => void;
}

export function BlogReviewConfirmModal({
  confirmAction,
  onClose,
  onConfirm,
}: BlogReviewConfirmModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!confirmAction) return null;

  const isPublish = confirmAction.type === ContentStatus.PUBLISHED;

  const handleConfirmClick = () => {
    if (!isPublish && !rejectReason.trim()) {
      setErrorMsg('Vui lòng nhập lý do từ chối trước khi gửi.');
      return;
    }
    onConfirm(confirmAction.item, confirmAction.type, isPublish ? undefined : rejectReason.trim());
    setRejectReason('');
    setErrorMsg('');
  };

  const handleClose = () => {
    setRejectReason('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 60,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#ffffff',
          borderRadius: 24,
          border: BORDER_LIGHT,
          padding: 26,
          boxShadow: '0 28px 70px rgba(15, 23, 42, 0.14)',
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#5c5f64',
              fontWeight: 700,
            }}
          >
            {isPublish ? 'Xác nhận duyệt' : 'Từ chối bài viết'}
          </div>
          <h3
            style={{
              margin: '10px 0 0',
              fontSize: 24,
              lineHeight: 1.3,
              color: '#1f2a37',
              fontWeight: 800,
            }}
          >
            {isPublish ? 'Bạn có muốn duyệt bài này không?' : 'Bạn có muốn từ chối bài này không?'}
          </h3>
        </div>

        <div style={{ color: '#3d4853', fontSize: 15, lineHeight: 1.8, marginBottom: 18 }}>
          <div>
            <strong>Bài:</strong> {confirmAction.item.title}
          </div>
          <div>
            <strong>Tác giả:</strong> {confirmAction.item.author}
          </div>
        </div>

        {!isPublish ? (
          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="blog-review-reject-reason"
              style={{ display: 'block', fontWeight: 700, color: '#1f2a37', marginBottom: 8 }}
            >
              Lý do từ chối
            </label>
            <textarea
              id="blog-review-reject-reason"
              value={rejectReason}
              onChange={(event) => {
                setRejectReason(event.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              rows={4}
              placeholder="Ví dụ: thiếu nguồn, nội dung chưa đạt yêu cầu..."
              style={{
                width: '100%',
                resize: 'vertical',
                borderRadius: 16,
                border: '1px solid #dfe3e8',
                background: '#f8fafc',
                padding: '12px 14px',
                fontSize: 14,
                outline: 'none',
                color: '#1f2a37',
              }}
            />
            {errorMsg ? (
              <p style={{ margin: '6px 0 0', color: '#8d3d34', fontSize: 13 }}>{errorMsg}</p>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              border: '1px solid #dfe3e8',
              borderRadius: 999,
              background: '#f3f4f6',
              color: '#374151',
              fontWeight: 700,
              padding: '10px 16px',
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            style={{
              border: 'none',
              borderRadius: 999,
              background: isPublish ? '#1f2937' : '#8d3d34',
              color: '#fff',
              fontWeight: 700,
              padding: '10px 16px',
              cursor: 'pointer',
            }}
          >
            {isPublish ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- BlogReviewPreviewModal.tsx ---
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

export { BlogReviewTable } from './BlogReviewTable';
