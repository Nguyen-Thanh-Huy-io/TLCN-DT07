'use client';

import React from 'react';
import {
  BORDER_LIGHT,
  REVIEW_TABS,
  ReviewTabState,
} from '../constants/review.constant';
import type { ReviewPost } from '../types/review.types';

interface BlogReviewTableProps {
  tab: ReviewTabState;
  onChangeTab: (tab: ReviewTabState) => void;
  search: string;
  onChangeSearch: (query: string) => void;
  loading: boolean;
  items: ReviewPost[];
  selectedItemId?: string;
  previewLoading: boolean;
  onSelectPost: (post: ReviewPost) => void;
}

function getStatusBadgeStyle(status: ReviewTabState): { bg: string; color: string } {
  if (status === ReviewTabState.PENDING) {
    return { bg: '#f3e2a7', color: '#7a5a00' };
  }
  if (status === ReviewTabState.APPROVED) {
    return { bg: '#dfeee3', color: '#1d5a3a' };
  }
  return { bg: '#f7d9d5', color: '#8d3d34' };
}

export function BlogReviewTable({
  tab,
  onChangeTab,
  search,
  onChangeSearch,
  loading,
  items,
  selectedItemId,
  previewLoading,
  onSelectPost,
}: BlogReviewTableProps) {
  return (
    <div
      style={{
        border: BORDER_LIGHT,
        background: '#ffffff',
        borderRadius: 18,
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 18,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            background: '#f3f4f6',
            borderRadius: 999,
            padding: 5,
            border: BORDER_LIGHT,
          }}
        >
          {REVIEW_TABS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChangeTab(value)}
              style={{
                border: 'none',
                borderRadius: 999,
                background: tab === value ? '#3a3f48' : 'transparent',
                color: tab === value ? '#fff' : '#5c5f64',
                fontWeight: 600,
                fontSize: 14,
                padding: '10px 18px',
                cursor: 'pointer',
              }}
            >
              {value}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: BORDER_LIGHT,
            background: '#f9fafb',
            borderRadius: 999,
            padding: '8px 14px',
            minWidth: 290,
          }}
        >
          <span style={{ fontSize: 16, color: '#4f5d66' }}>⌕</span>
          <input
            value={search}
            onChange={(event) => onChangeSearch(event.target.value)}
            placeholder="Tìm bài viết..."
            aria-label="Tìm bài viết"
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              width: '100%',
              color: '#1f2a37',
              fontSize: 14,
            }}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            minWidth: 1120,
            borderCollapse: 'separate',
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr
              style={{
                background: '#f3f4f6',
                color: '#5a5d62',
                fontSize: 12,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              <th
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderBottom: BORDER_LIGHT,
                  width: '42%',
                }}
              >
                Bài viết
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderBottom: BORDER_LIGHT,
                  width: '18%',
                }}
              >
                Tác giả
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderBottom: BORDER_LIGHT,
                  width: '12%',
                }}
              >
                Ngày
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderBottom: BORDER_LIGHT,
                  width: '14%',
                }}
              >
                Trạng thái
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderBottom: BORDER_LIGHT,
                  width: '14%',
                }}
              >
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: 'center', padding: '24px 12px', color: '#5c5f64' }}
                >
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: 'center', padding: '24px 12px', color: '#5c5f64' }}
                >
                  Không có bài nào ở trạng thái “{tab}”.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const badgeStyle = getStatusBadgeStyle(item.status);
                const isSelected = selectedItemId === item.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectPost(item)}
                    style={{
                      borderBottom: BORDER_LIGHT,
                      cursor: 'pointer',
                      background: isSelected ? '#f9f7f3' : 'transparent',
                    }}
                  >
                    <td
                      style={{
                        padding: '18px 16px',
                        borderBottom: BORDER_LIGHT,
                        verticalAlign: 'top',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 18,
                          color: '#1f2a37',
                          marginBottom: 6,
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ color: '#4d5561', fontSize: 14, lineHeight: 1.6 }}>
                        {item.summary}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '18px 16px',
                        borderBottom: BORDER_LIGHT,
                        color: '#323a41',
                        fontSize: 14,
                      }}
                    >
                      {item.author}
                    </td>
                    <td
                      style={{
                        padding: '18px 16px',
                        borderBottom: BORDER_LIGHT,
                        color: '#323a41',
                        fontSize: 14,
                      }}
                    >
                      {item.createdAt}
                    </td>
                    <td style={{ padding: '18px 16px', borderBottom: BORDER_LIGHT }}>
                      <span
                        style={{
                          display: 'inline-block',
                          background: badgeStyle.bg,
                          color: badgeStyle.color,
                          borderRadius: 999,
                          padding: '6px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '18px 16px',
                        borderBottom: BORDER_LIGHT,
                        color: '#5c5f64',
                        fontSize: 13,
                      }}
                    >
                      {previewLoading && isSelected ? 'Đang mở...' : 'Nhấp để xem'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
