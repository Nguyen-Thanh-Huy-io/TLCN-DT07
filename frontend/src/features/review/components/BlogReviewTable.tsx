'use client';

import { BORDER_LIGHT, REVIEW_TABS, ReviewTabState, type ReviewPost } from './ReviewHubView';

// --- BlogReviewTable.tsx ---
export interface BlogReviewTableProps {
  tab: ReviewTabState;
  onChangeTab: (tab: ReviewTabState) => void;
  search: string;
  onChangeSearch: (query: string) => void;
  loading: boolean;
  items: ReviewPost[];
  selectedItemId?: string;
  onSelectPost: (post: ReviewPost) => void;
}

export function getStatusBadgeStyle(status: ReviewTabState): { bg: string; color: string } {
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
  onSelectPost,
}: BlogReviewTableProps) {
  return (
    <div className="panel management-panel min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Kiểm duyệt Bài Blog</h2>
          <p className="text-xs text-slate-500">
            Duyệt xuất bản bài viết cộng đồng &amp; blog lịch sử ({items.length} bài)
          </p>
        </div>

        <div className="inline-flex self-start sm:self-auto flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {REVIEW_TABS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChangeTab(value)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                tab === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 max-w-md">
        <input
          value={search}
          onChange={(event) => onChangeSearch(event.target.value)}
          placeholder="Tìm bài blog theo tiêu đề, tác giả..."
          aria-label="Tìm bài viết"
          className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none"
        />
      </div>

      <div className="w-full min-w-0 overflow-x-auto">
        <table
          className="w-full min-w-[640px]"
          style={{
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
                      Nhấp để xem
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
