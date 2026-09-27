"use client";
import React from "react";
import { useEffect, useMemo, useState } from "react"
import api from "@/services/api"

type IconName = "grid" | "clock" | "folder" | "book" | "calendar" | "tag" | "check" | "users" | "search" | "bell" | "chevron" | "more" | "plus" | "arrow" | "logout" | "menu" | "edit" | "eye" | "trash" | "filter" | "spark"

export const iconPaths: Record<IconName, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  folder: <path d="M3 7.5h6l2-3h10v15H3z" />,
  book: (
    <>
      <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23z" />
      <path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4m8-4v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </>
  ),
  tag: (
    <>
      <path d="M20 13 12 21l-9-9V3h9z" />
      <circle cx="8" cy="8" r="1.5" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6m3-3h-6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="m9 18 6-6-6-6" />,
  logout: (
    <>
      <path d="M10 17l5-5-5-5m5 5H3" />
      <path d="M15 4h5v16h-5" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  edit: (
    <>
      <path d="m14 4 6 6L9 21H3v-6z" />
      <path d="m12 6 6 6" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7" />
      <path d="M10 11v6m4-6v6" />
    </>
  ),
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
  spark: (
    <>
      <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2z" />
      <path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z" />
    </>
  ),
}

export function Icon({ name, size = 18 }: { name: IconName, size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  )
}

export const navGroups = [
  {
    label: "TỔNG QUAN",
    items: [
      { label: "Dashboard", icon: "grid" as IconName, page: "dashboard" },
    ],
  },
  {
    label: "NỘI DUNG",
    items: [
      {
        label: "Giai đoạn lịch sử",
        icon: "clock" as IconName,
        page: "periods",
      },
      { label: "Chủ đề", icon: "folder" as IconName, page: "topics" },
      { label: "Bài học", icon: "book" as IconName, page: "lessons" },
      {
        label: "Sự kiện lịch sử",
        icon: "calendar" as IconName,
        page: "events",
      },
      { label: "Thẻ", icon: "tag" as IconName, page: "tags" },
    ],
  },
  {
    label: "KIỂM DUYỆT",
    items: [
      {
        label: "Duyệt bài học",
        icon: "check" as IconName,
        page: "review",
        count: 8,
      },
    ],
  },
  {
    label: "HỆ THỐNG",
    items: [{ label: "Người dùng", icon: "users" as IconName, page: "users" }],
  },
]

export const pageMeta: Record<string, { title: string, subtitle: string }> = {
  dashboard: {
    title: "Tổng quan",
    subtitle: "Quản lý nội dung học tập trên HISGO",
  },
  periods: {
    title: "Giai đoạn lịch sử",
    subtitle: "Quản lý các giai đoạn lịch sử trong hệ thống",
  },
  topics: {
    title: "Chủ đề lịch sử",
    subtitle: "Tổ chức chủ đề theo từng giai đoạn lịch sử",
  },
  lessons: { title: "Bài học", subtitle: "Quản lý nội dung bài học lịch sử" },
  events: {
    title: "Sự kiện lịch sử",
    subtitle: "Quản lý các mốc sự kiện theo chủ đề",
  },
  tags: { title: "Thẻ", subtitle: "Quản lý nhãn phân loại nội dung" },
  review: {
    title: "Duyệt bài học",
    subtitle: "Kiểm tra chất lượng trước khi xuất bản",
  },
  users: {
    title: "Người dùng",
    subtitle: "Quản lý tài khoản và phân quyền hệ thống",
  },
}

export const Badge = ({
  children,
  tone = "gray",
}: {
  children: React.ReactNode
  tone?: string
}) => (
  <span className={`badge badge-${tone}`}>
    <span className="badge-dot" />
    {children}
  </span>
)

export const Avatar = ({
  text = "MA",
  small = false,
}: {
  text?: string
  small?: boolean
}) => <span className={`avatar ${small ? "avatar-sm" : ""}`}>{text}</span>

export function Logo() {
  return (
    <div className="logo-wrap">
      <div className="logo-mark">
        <span>H</span>
        <i />
      </div>
      <div>
        <strong>HISGO</strong>
        <small>CONTENT SYSTEM</small>
      </div>
    </div>
  )
}

export function Sidebar({
  page,
  setPage,
  open,
  close,
}: {
  page: string
  setPage: (p: string) => void
  open: boolean
  close: () => void
}) {
  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "show" : ""}`}
        onClick={close}
      />
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-head">
          <Logo />
          <button className="mobile-close" onClick={close}>
            ×
          </button>
        </div>
        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => (
                <button
                  key={item.page}
                  className={`nav-item ${page === item.page ? "active" : ""}`}
                  onClick={() => {
                    setPage(item.page)
                    close()
                  }}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {'count' in item && item.count && <em>{item.count}</em>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-user">
          <Avatar text="MA" small />
          <div>
            <strong>Minh Anh</strong>
            <span>Quản trị viên</span>
          </div>
          <button
            title="Đăng xuất"
            onClick={() => {
              if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống CMS?")) {
                alert("Đã đăng xuất thành công! (POST /auth/logout)")
              }
            }}
          >
            <Icon name="logout" size={17} />
          </button>
        </div>
      </aside>
    </>
  )
}

export function Topbar({ page, openNav }: { page: string, openNav: () => void }) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button className="menu-btn" onClick={openNav}>
          <Icon name="menu" />
        </button>
        <span>HISGO CMS</span>
        <Icon name="chevron" size={14} />
        <strong>{pageMeta[page]?.title ?? "HISGO CMS"}</strong>
      </div>
      <div className="top-actions">
        <label className="global-search">
          <Icon name="search" size={17} />
          <input placeholder="Tìm kiếm trong hệ thống..." />
          <kbd>⌘ K</kbd>
        </label>
        <button className="icon-btn notification">
          <Icon name="bell" />
          <i />
        </button>
        <span className="top-divider" />
        <Avatar text="MA" small />
        <div className="top-user">
          <strong>Minh Anh</strong>
          <span>Quản trị viên</span>
        </div>
        <Icon name="chevron" size={14} />
      </div>
    </header>
  )
}

export const StatCard = ({
  icon,
  value,
  label,
  detail,
  tone,
}: {
  icon: IconName
  value: string
  label: string
  detail: string
  tone: string
}) => (
  <div className="stat-card">
    <div className={`stat-icon ${tone}`}>
      <Icon name={icon} size={21} />
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-detail">
      <span>↑ 12%</span>
      {detail}
    </div>
  </div>
)

export function ActionMenu({
  onEdit,
  onDelete,
  onView,
}: {
  onEdit?: () => void
  onDelete?: () => void
  onView?: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="action-menu-wrapper" style={{ position: "relative" }}>
      <button
        className="action-more"
        aria-label="Mở thao tác"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
      >
        <Icon name="more" />
      </button>
      {open && (
        <>
          <div
            className="action-menu-backdrop"
            onClick={() => setOpen(false)}
          />
          <div className="action-dropdown">
            <button
              className="dropdown-item"
              onClick={() => {
                setOpen(false)
                onView ? onView() : alert("Xem thông tin chi tiết")
              }}
            >
              <Icon name="eye" size={14} /> Xem chi tiết
            </button>
            <button
              className="dropdown-item"
              onClick={() => {
                setOpen(false)
                onEdit ? onEdit() : alert("Chỉnh sửa nội dung")
              }}
            >
              <Icon name="edit" size={14} /> Chỉnh sửa
            </button>
            <button
              className="dropdown-item danger"
              onClick={() => {
                setOpen(false)
                onDelete ? onDelete() : alert("Xóa mục này")
              }}
            >
              <Icon name="trash" size={14} /> Xóa
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function Dashboard({ navigate }: { navigate: (p: string) => void }) {
  return (
    <>
      <section className="stats-grid">
        <StatCard
          icon="clock"
          value="12"
          label="Giai đoạn lịch sử"
          detail="so với tháng trước"
          tone="blue"
        />
        <StatCard
          icon="folder"
          value="48"
          label="Chủ đề"
          detail="4 chủ đề mới"
          tone="gold"
        />
        <StatCard
          icon="book"
          value="126"
          label="Bài học"
          detail="8 bài học mới"
          tone="green"
        />
        <StatCard
          icon="check"
          value="8"
          label="Chờ duyệt"
          detail="Cần xử lý"
          tone="orange"
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel recent-panel">
          <div className="panel-head">
            <div>
              <h2>Nội dung gần đây</h2>
              <p>Nội dung vừa được cập nhật trong hệ thống</p>
            </div>
            <button className="text-button">
              Xem tất cả <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>NỘI DUNG</th>
                  <th>LOẠI</th>
                  <th>TRẠNG THÁI</th>
                  <th>NGƯỜI TẠO</th>
                  <th>CẬP NHẬT</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <ContentCell
                      icon="book"
                      title="Chiến dịch Điện Biên Phủ"
                      sub="Chiến dịch Điện Biên Phủ"
                    />
                  </td>
                  <td>Bài học</td>
                  <td>
                    <Badge>Draft</Badge>
                  </td>
                  <td>
                    <UserCell initials="NA" name="Nguyễn Văn A" />
                  </td>
                  <td>2 giờ trước</td>
                  <td>
                    <ActionMenu />
                  </td>
                </tr>
                <tr>
                  <td>
                    <ContentCell
                      icon="clock"
                      title="Nhà Nguyễn"
                      sub="Lịch sử Việt Nam cận đại"
                    />
                  </td>
                  <td>Giai đoạn</td>
                  <td>
                    <Badge tone="green">Published</Badge>
                  </td>
                  <td>
                    <UserCell initials="AD" name="Admin" />
                  </td>
                  <td>Hôm qua</td>
                  <td>
                    <ActionMenu />
                  </td>
                </tr>
                <tr>
                  <td>
                    <ContentCell
                      icon="folder"
                      title="Cách mạng tháng Tám"
                      sub="Việt Nam 1930–1945"
                    />
                  </td>
                  <td>Chủ đề</td>
                  <td>
                    <Badge tone="green">Published</Badge>
                  </td>
                  <td>
                    <UserCell initials="LH" name="Lê Hoàng" />
                  </td>
                  <td>20/09/2026</td>
                  <td>
                    <ActionMenu />
                  </td>
                </tr>
                <tr>
                  <td>
                    <ContentCell
                      icon="book"
                      title="Hiệp định Genève 1954"
                      sub="Kháng chiến chống Pháp"
                    />
                  </td>
                  <td>Bài học</td>
                  <td>
                    <Badge tone="amber">Pending Review</Badge>
                  </td>
                  <td>
                    <UserCell initials="MT" name="Mai Trang" />
                  </td>
                  <td>19/09/2026</td>
                  <td>
                    <ActionMenu />
                  </td>
                </tr>
                <tr>
                  <td>
                    <ContentCell
                      icon="calendar"
                      title="Toàn quốc kháng chiến"
                      sub="Kháng chiến chống Pháp"
                    />
                  </td>
                  <td>Sự kiện</td>
                  <td>
                    <Badge tone="green">Published</Badge>
                  </td>
                  <td>
                    <UserCell initials="NA" name="Nguyễn Văn A" />
                  </td>
                  <td>18/09/2026</td>
                  <td>
                    <ActionMenu />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="right-stack">
          <div className="panel pending-panel">
            <div className="panel-head">
              <div>
                <h2>Bài học chờ duyệt</h2>
                <p>8 bài học đang chờ xử lý</p>
              </div>
              <button className="count-pill">8</button>
            </div>
            {[
              [
                "Chiến dịch Điện Biên Phủ năm 1954",
                "Chiến dịch Điện Biên Phủ",
                "Nguyễn Văn A",
                "22/09/2026",
              ],
              [
                "Nguyên nhân bùng nổ Toàn quốc kháng chiến",
                "Kháng chiến toàn quốc",
                "Mai Trang",
                "21/09/2026",
              ],
              [
                "Nội dung Hiệp định Genève",
                "Hiệp định Genève",
                "Lê Hoàng",
                "20/09/2026",
              ],
            ].map((x, i) => (
              <div className="pending-item" key={x[0]}>
                <div className="pending-index">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <strong>{x[0]}</strong>
                  <span>{x[1]}</span>
                  <small>
                    {x[2]} · {x[3]}
                  </small>
                </div>
                <button onClick={() => navigate("review")}>
                  <Icon name="eye" size={16} /> Duyệt
                </button>
              </div>
            ))}
            <button className="panel-footer" onClick={() => navigate("review")}>
              Xem tất cả bài chờ duyệt <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="panel quick-panel">
            <div className="panel-head">
              <div>
                <h2>Thao tác nhanh</h2>
                <p>Bắt đầu tạo nội dung mới</p>
              </div>
            </div>
            <div className="quick-grid">
              <QuickAction
                icon="clock"
                label="Thêm giai đoạn"
                onClick={() => navigate("period-form")}
              />
              <QuickAction
                icon="folder"
                label="Thêm chủ đề"
                onClick={() => navigate("topic-form")}
              />
              <QuickAction
                icon="book"
                label="Tạo bài học"
                primary
                onClick={() => navigate("lesson-editor")}
              />
              <QuickAction
                icon="calendar"
                label="Thêm sự kiện"
                onClick={() => navigate("events")}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export function QuickAction({
  icon,
  label,
  primary,
  onClick,
}: {
  icon: IconName
  label: string
  primary?: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`quick-action ${primary ? "primary" : ""}`}
      onClick={onClick}
    >
      <span>
        <Icon name={icon} />
      </span>
      {label}
      <Icon name="plus" size={16} />
    </button>
  )
}

export function ContentCell({
  icon,
  title,
  sub,
}: {
  icon: IconName
  title: string
  sub: string
}) {
  return (
    <div className="content-cell">
      <span>
        <Icon name={icon} size={17} />
      </span>
      <div>
        <strong>{title}</strong>
        <small>{sub}</small>
      </div>
    </div>
  )
}

export function UserCell({ initials, name }: { initials: string, name: string }) {
  return (
    <div className="user-cell">
      <Avatar text={initials} small />
      <span>{name}</span>
    </div>
  )
}

const data: Record<string, {
  filters: string[]
  button: string
  heads: string[]
  rows: React.ReactNode[][]
}> = {
  periods: {
    filters: ["Khu vực", "Trạng thái"],
    button: "Thêm giai đoạn",
    heads: [
      "GIAI ĐOẠN",
      "KHU VỰC",
      "THỜI GIAN",
      "THỨ TỰ",
      "TRẠNG THÁI",
      "CẬP NHẬT",
    ],
    rows: [
      [
        <ContentCell
          icon="clock"
          title="Kháng chiến chống Pháp"
          sub="4 chủ đề · 18 bài học"
        />,
        "Việt Nam",
        "1945 – 1954",
        "05",
        <Badge tone="green">Published</Badge>,
        "20/09/2026",
      ],
      [
        <ContentCell
          icon="clock"
          title="Việt Nam thời kỳ dựng nước"
          sub="6 chủ đề · 22 bài học"
        />,
        "Việt Nam",
        "2879 TCN – 179 TCN",
        "01",
        <Badge tone="green">Published</Badge>,
        "18/09/2026",
      ],
      [
        <ContentCell
          icon="clock"
          title="Thời kỳ Bắc thuộc"
          sub="5 chủ đề · 16 bài học"
        />,
        "Việt Nam",
        "179 TCN – 938",
        "02",
        <Badge tone="green">Published</Badge>,
        "17/09/2026",
      ],
      [
        <ContentCell
          icon="clock"
          title="Các triều đại phong kiến"
          sub="8 chủ đề · 28 bài học"
        />,
        "Việt Nam",
        "938 – 1858",
        "03",
        <Badge tone="green">Published</Badge>,
        "15/09/2026",
      ],
      [
        <ContentCell
          icon="clock"
          title="Lịch sử thế giới hiện đại"
          sub="Đang biên soạn"
        />,
        "Thế giới",
        "1917 – Nay",
        "08",
        <Badge>Draft</Badge>,
        "12/09/2026",
      ],
    ],
  },
  topics: {
    filters: ["Giai đoạn", "Học tuần tự", "Trạng thái"],
    button: "Thêm chủ đề",
    heads: [
      "CHỦ ĐỀ",
      "GIAI ĐOẠN",
      "HỌC TUẦN TỰ",
      "THỨ TỰ",
      "TRẠNG THÁI",
      "CẬP NHẬT",
    ],
    rows: [
      [
        <ContentCell
          icon="folder"
          title="Chiến dịch Điện Biên Phủ"
          sub="6 bài học · 5 sự kiện"
        />,
        "Kháng chiến chống Pháp",
        "Có",
        "03",
        <Badge tone="green">Published</Badge>,
        "22/09/2026",
      ],
      [
        <ContentCell
          icon="folder"
          title="Cách mạng tháng Tám"
          sub="5 bài học · 4 sự kiện"
        />,
        "Việt Nam 1930–1945",
        "Có",
        "04",
        <Badge tone="green">Published</Badge>,
        "20/09/2026",
      ],
      [
        <ContentCell
          icon="folder"
          title="Kháng chiến toàn quốc"
          sub="4 bài học · 3 sự kiện"
        />,
        "Kháng chiến chống Pháp",
        "Không",
        "02",
        <Badge tone="amber">Review</Badge>,
        "19/09/2026",
      ],
      [
        <ContentCell
          icon="folder"
          title="Hiệp định Genève"
          sub="3 bài học · 2 sự kiện"
        />,
        "Kháng chiến chống Pháp",
        "Có",
        "05",
        <Badge>Draft</Badge>,
        "17/09/2026",
      ],
    ],
  },
  lessons: {
    filters: ["Giai đoạn", "Chủ đề", "Độ khó", "Trạng thái"],
    button: "Tạo bài học",
    heads: [
      "BÀI HỌC",
      "CHỦ ĐỀ",
      "ĐỘ KHÓ",
      "XP",
      "THỜI GIAN",
      "TRẠNG THÁI",
      "NGƯỜI TẠO",
    ],
    rows: [
      [
        <ContentCell
          icon="book"
          title="Chiến dịch Điện Biên Phủ năm 1954"
          sub="Cập nhật 2 giờ trước"
        />,
        "Chiến dịch Điện Biên Phủ",
        <Badge tone="blue">Medium</Badge>,
        "120",
        "12 phút",
        <Badge tone="amber">Pending Review</Badge>,
        "Nguyễn Văn A",
      ],
      [
        <ContentCell
          icon="book"
          title="Bối cảnh lịch sử trước chiến dịch"
          sub="Cập nhật hôm qua"
        />,
        "Chiến dịch Điện Biên Phủ",
        <Badge tone="green">Easy</Badge>,
        "80",
        "8 phút",
        <Badge tone="green">Published</Badge>,
        "Mai Trang",
      ],
      [
        <ContentCell
          icon="book"
          title="Diễn biến ba đợt tiến công"
          sub="Cập nhật 18/09/2026"
        />,
        "Chiến dịch Điện Biên Phủ",
        <Badge tone="red">Hard</Badge>,
        "150",
        "16 phút",
        <Badge>Draft</Badge>,
        "Lê Hoàng",
      ],
      [
        <ContentCell
          icon="book"
          title="Ý nghĩa lịch sử của chiến thắng"
          sub="Cập nhật 16/09/2026"
        />,
        "Chiến dịch Điện Biên Phủ",
        <Badge tone="blue">Medium</Badge>,
        "100",
        "10 phút",
        <Badge tone="red">Rejected</Badge>,
        "Nguyễn Văn A",
      ],
    ],
  },
}

export function ManagementPage({
  type,
  navigate,
  dataRows,
}: {
  type: string
  navigate: (p: string) => void
  dataRows?: React.ReactNode[][]
}) {
  const config = data[type] || data.lessons
  const [query, setQuery] = useState("")
  const actionTarget =
    type === "periods"
      ? "period-form"
      : type === "topics"
        ? "topic-form"
        : "lesson-editor"
  
  const actualRows = dataRows || config.rows

  const filtered = useMemo(
    () =>
      actualRows.filter(
        (row) =>
          !query ||
          JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
      ),
    [actualRows, query],
  )
  return (
    <div className="panel management-panel">
      <div className="toolbar">
        <label className="search-box">
          <Icon name="search" size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Tìm kiếm ${pageMeta[type]?.title.toLowerCase() || "nội dung"}...`}
          />
        </label>
        <div className="filters">
          {config.filters.map((f) => (
            <button key={f}>
              <Icon name="filter" size={14} />
              {f}
              <span>⌄</span>
            </button>
          ))}
        </div>
        <button
          className="primary-button"
          onClick={() => navigate(actionTarget)}
        >
          <Icon name="plus" size={17} />
          {config.button}
        </button>
      </div>
      <div className="table-scroll">
        <table className="management-table">
          <thead>
            <tr>
              <th className="check-col">
                <input type="checkbox" />
              </th>
              {config.heads.map((h) => (
                <th key={h}>{h}</th>
              ))}
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i}>
                <td>
                  <input type="checkbox" />
                </td>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
                <td>
                  <ActionMenu />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>
          Hiển thị 1–{filtered.length} trong {filtered.length} kết quả
        </span>
        <div>
          <button disabled>‹</button>
          <button className="selected">1</button>
          <button>2</button>
          <button>3</button>
          <button>›</button>
        </div>
      </div>
    </div>
  )
}

export function FormPage({
  kind,
  navigate,
}: {
  kind: "period" | "topic"
  navigate: (p: string) => void
}) {
  const period = kind === "period"
  const [loadingPeriods, setLoadingPeriods] = useState(false)
  const [periodOptions, setPeriodOptions] = useState<Array<{ id: string; name: string }>>([])
  const [form, setForm] = useState({
    name: "",
    region: "Việt Nam",
    displayOrder: "",
    startYear: "",
    endYear: "",
    description: "",
    status: "DRAFT",
    selectedPeriodId: "",
    isSequential: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!period) {
      setLoadingPeriods(true)
      api
        .get("/periods")
        .then((res) => {
          const payload = res.data?.items || res.data?.data || res.data || []
          const list = Array.isArray(payload) ? payload : []
          setPeriodOptions(list)
          if (list[0] && !form.selectedPeriodId) {
            setForm((prev) => ({ ...prev, selectedPeriodId: list[0].id }))
          }
        })
        .catch((err) => {
          console.error("Failed to load periods for topic form:", err)
          setPeriodOptions([])
        })
        .finally(() => setLoadingPeriods(false))
    }
  }, [period])

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (period) {
      if (!form.name.trim() || !form.startYear) {
        alert("Vui lòng nhập tên giai đoạn và năm bắt đầu.")
        return
      }

      try {
        setSaving(true)
        await api.post("/periods", {
          name: form.name.trim(),
          region: form.region || "Việt Nam",
          startYear: Number(form.startYear),
          endYear: form.endYear ? Number(form.endYear) : undefined,
          description: form.description.trim() || undefined,
          displayOrder: Number(form.displayOrder || 0),
          status: form.status,
        })
        navigate("periods")
      } catch (err: any) {
        console.error("Failed to save period:", err)
        alert(err?.response?.data?.message || "Không thể lưu giai đoạn.")
      } finally {
        setSaving(false)
      }
      return
    }

    if (!form.selectedPeriodId) {
      alert("Không có giai đoạn nào để gắn cho chủ đề.")
      return
    }

    if (!form.name.trim()) {
      alert("Vui lòng nhập tên chủ đề.")
      return
    }

    try {
      setSaving(true)
      await api.post("/topics", {
        periodId: form.selectedPeriodId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        displayOrder: Number(form.displayOrder || 0),
        isSequential: form.isSequential,
        status: form.status,
      })
      navigate("topics")
    } catch (err: any) {
      console.error("Failed to save topic:", err)
      alert(err?.response?.data?.message || "Không thể lưu chủ đề.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="form-page" onSubmit={handleSubmit}>
      <div className="form-main">
        <section className="form-card">
          <div className="section-title">
            <span>01</span>
            <div>
              <h2>Thông tin cơ bản</h2>
              <p>Thông tin nhận diện và phân loại nội dung</p>
            </div>
          </div>
          {period ? (
            <>
              <Field
                label="Tên giai đoạn"
                required
                placeholder="Ví dụ: Kháng chiến chống Pháp"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
              <div className="field-row">
                <SelectField
                  label="Khu vực"
                  required
                  value={form.region}
                  onChange={(e) => updateField("region", e.target.value)}
                  options={["Việt Nam", "Thế giới", "Đông Nam Á"]}
                />
                <Field
                  label="Thứ tự hiển thị"
                  type="number"
                  placeholder="05"
                  value={form.displayOrder}
                  onChange={(e) => updateField("displayOrder", e.target.value)}
                />
              </div>
              <div className="field-row">
                <Field
                  label="Năm bắt đầu"
                  required
                  type="number"
                  placeholder="1945"
                  value={form.startYear}
                  onChange={(e) => updateField("startYear", e.target.value)}
                />
                <Field
                  label="Năm kết thúc"
                  type="number"
                  placeholder="1954 (không bắt buộc)"
                  value={form.endYear}
                  onChange={(e) => updateField("endYear", e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <SelectField
                label="Giai đoạn lịch sử"
                required
                value={
                  periodOptions.find((p) => p.id === form.selectedPeriodId)?.name ||
                  (loadingPeriods ? "Đang tải..." : "Chọn giai đoạn")
                }
                onChange={(e) => updateField("selectedPeriodId", e.target.value)}
                options={periodOptions.map((p) => p.name)}
                optionValues={periodOptions.map((p) => p.id)}
              />
              <Field
                label="Tên chủ đề"
                required
                placeholder="Ví dụ: Chiến dịch Điện Biên Phủ"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </>
          )}
        </section>
        <section className="form-card">
          <div className="section-title">
            <span>02</span>
            <div>
              <h2>Nội dung</h2>
              <p>Mô tả ngắn gọn giúp biên tập viên hiểu rõ nội dung</p>
            </div>
          </div>
          <label className="field">
            <span>Mô tả</span>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder={
                period
                  ? "Nhập mô tả về bối cảnh và phạm vi của giai đoạn..."
                  : "Nhập mô tả tổng quan về chủ đề lịch sử..."
              }
            />
            <small>{form.description.length} / 500 ký tự</small>
          </label>
          <label className="field">
            <span>Ảnh bìa</span>
            <div className="upload-box">
              <div>
                <Icon name="plus" />
                <strong>Tải ảnh lên</strong>
              </div>
              <p>Kéo thả hoặc nhấp để chọn ảnh · PNG, JPG tối đa 5MB</p>
            </div>
          </label>
        </section>
        {!period && (
          <section className="form-card">
            <div className="section-title">
              <span>03</span>
              <div>
                <h2>Cấu hình học tập</h2>
                <p>Thiết lập cách học sinh tiếp cận chủ đề</p>
              </div>
            </div>
            <div className="toggle-row">
              <div>
                <strong>Học tuần tự</strong>
                <p>
                  Học sinh phải hoàn thành bài trước trước khi mở bài tiếp theo.
                </p>
              </div>
              <button
                type="button"
                className={`toggle ${form.isSequential ? "on" : ""}`}
                onClick={() => updateField("isSequential", !form.isSequential)}
              >
                <i />
              </button>
            </div>
          </section>
        )}
      </div>
      <aside className="form-side">
        <div className="form-card">
          <h3>Cài đặt xuất bản</h3>
          <SelectField
            label="Trạng thái"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            options={["DRAFT", "PUBLISHED", "PENDING_REVIEW"]}
          />
          <div className="info-note">
            <Icon name="spark" size={17} />
            <p>Nội dung ở trạng thái bản nháp chỉ hiển thị trong CMS.</p>
          </div>
        </div>
        <div className="hierarchy-card">
          <span>HỆ THỐNG NỘI DUNG</span>
          <div className="tree-item muted">
            <Icon name="clock" size={16} /> Giai đoạn
          </div>
          <i />
          <div className={`tree-item ${period ? "active" : "muted"}`}>
            <Icon name={period ? "clock" : "folder"} size={16} />
            {period ? "Nội dung đang tạo" : "Chủ đề đang tạo"}
          </div>
          {!period && (
            <>
              <i />
              <div className="tree-item muted">
                <Icon name="book" size={16} /> Bài học
              </div>
            </>
          )}
        </div>
      </aside>
      <div className="sticky-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate(period ? "periods" : "topics")}
        >
          Hủy
        </button>
        <div>
          <span>Mọi thay đổi sẽ được lưu vào bản nháp</span>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Đang lưu..." : `Lưu ${period ? "giai đoạn" : "chủ đề"}`}
          </button>
        </div>
      </div>
    </form>
  )
}

export function Field({
  label,
  required,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string
  required?: boolean
  placeholder: string
  type?: string
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <b>*</b>}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={onChange}
      />
    </label>
  )
}
export function SelectField({
  label,
  required,
  value,
  onChange,
  options,
  optionValues,
}: {
  label: string
  required?: boolean
  value: string
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options?: string[]
  optionValues?: string[]
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <b>*</b>}
      </span>
      <select className="select-input" value={value} onChange={onChange}>
        {options && options.length > 0 ? (
          options.map((option, idx) => (
            <option key={`${label}-${option}-${idx}`} value={optionValues?.[idx] ?? option}>
              {option}
            </option>
          ))
        ) : (
          <option value={value}>{value}</option>
        )}
      </select>
    </label>
  )
}

export function LessonEditor({ navigate }: { navigate: (p: string) => void }) {
  const [topics, setTopics] = useState<Array<{ id: string; name: string }>>([])
  const [saving, setSaving] = useState(false)
  const [selectedTopicId, setSelectedTopicId] = useState("")
  const [status, setStatus] = useState("DRAFT")
  const [title, setTitle] = useState("Chiến dịch Điện Biên Phủ năm 1954")
  const [contentRichText, setContentRichText] = useState(`
    <h2>Bối cảnh lịch sử</h2>
    <p>Cuối năm 1953, cuộc kháng chiến chống thực dân Pháp của nhân dân Việt Nam bước sang năm thứ tám.</p>
    <p>Điện Biên Phủ được xây dựng thành một tập đoàn cứ điểm mạnh nhất Đông Dương, gồm <strong>49 cứ điểm</strong> được chia thành ba phân khu.</p>
    <blockquote>“Tất cả cho tiền tuyến, tất cả để chiến thắng!”</blockquote>
    <h2>Diễn biến chiến dịch</h2>
    <p>Chiến dịch diễn ra trong 56 ngày đêm, từ ngày 13 tháng 3 đến ngày 7 tháng 5 năm 1954.</p>
  `)
  const [difficulty, setDifficulty] = useState("MEDIUM")
  const [sourceReferenceNote, setSourceReferenceNote] = useState(
    "Viện Sử học (2017), Lịch sử Việt Nam, tập 10, NXB Khoa học Xã hội."
  )

  const loadTopics = async () => {
    try {
      const res = await api.get("/topics")
      const payload = res.data?.items || res.data?.data || res.data || []
      const list = Array.isArray(payload) ? payload : []
      setTopics(list)
      if (!selectedTopicId && list[0]) {
        setSelectedTopicId(list[0].id)
      }
    } catch (err) {
      console.error("Failed to load topics for lesson form:", err)
      setTopics([])
    }
  }

  useEffect(() => {
    loadTopics()
  }, [])

  const submitLesson = async (nextStatus: "DRAFT" | "PENDING_REVIEW") => {
    if (!selectedTopicId) {
      alert("Không có chủ đề nào để gắn bài học. Hãy tạo chủ đề trước.")
      return
    }

    if (!title.trim()) {
      alert("Vui lòng nhập tên bài học.")
      return
    }

    try {
      setSaving(true)
      await api.post("/lessons", {
        topicId: selectedTopicId,
        title: title.trim(),
        contentRichText: contentRichText.trim() || undefined,
        difficulty,
        sourceReferenceNote: sourceReferenceNote.trim() || undefined,
        status: nextStatus,
        displayOrder: 0,
      })
      navigate("lessons")
    } catch (err: any) {
      console.error("Failed to save lesson:", err)
      alert(err?.response?.data?.message || "Không thể lưu bài học. Vui lòng kiểm tra token / chủ đề / dữ liệu.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="editor-wrap">
      <div className="editor-actions">
        <Badge>Trạng thái: {status}</Badge>
        <button className="secondary-button">
          <Icon name="eye" size={16} /> Xem trước
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => submitLesson("DRAFT")}
          disabled={saving}
        >
          {saving ? "Đang lưu..." : "Lưu nháp"}
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => submitLesson("PENDING_REVIEW")}
          disabled={saving}
        >
          Gửi duyệt <Icon name="arrow" size={15} />
        </button>
      </div>
      <div className="editor-grid">
        <main className="editor-main">
          <div className="title-input">
            <span>TÊN BÀI HỌC</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên bài học"
            />
          </div>
          <section className="form-card rich-card">
            <div className="rich-label">NỘI DUNG BÀI HỌC</div>
            <div className="rich-toolbar">
              <select defaultValue="p">
                <option value="p">Đoạn văn</option>
              </select>
              <i />
              {[
                "B",
                "I",
                "U",
                "H1",
                "H2",
                "•",
                "1.",
                "❝",
                "↗",
                "⌁",
                "↶",
                "↷",
              ].map((x, i) => (
                <button key={i} className={i === 1 ? "italic" : ""}>
                  {x}
                </button>
              ))}
            </div>
            <article
              className="rich-content"
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setContentRichText((e.target as HTMLElement).innerHTML)}
              dangerouslySetInnerHTML={{ __html: contentRichText }}
            />
            <div className="word-count">{contentRichText.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length} từ</div>
          </section>
        </main>
        <aside className="editor-side">
          <section className="form-card">
            <h3>Phân loại</h3>
            <SelectField
              label="Chủ đề"
              required
              value={
                topics.find((topic) => topic.id === selectedTopicId)?.name ||
                (topics.length ? "Chọn chủ đề" : "Chưa có chủ đề")
              }
              onChange={(e) => setSelectedTopicId(e.target.value)}
              options={topics.map((topic) => topic.name)}
              optionValues={topics.map((topic) => topic.id)}
            />
            <div className="parent-path">
              <span>Thuộc giai đoạn</span>
              <strong>
                <Icon name="clock" size={14} /> {topics.length ? "Từ chủ đề đã chọn" : "Chưa có dữ liệu"}
              </strong>
            </div>
            <SelectField
              label="Độ khó"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              options={["EASY", "MEDIUM", "HARD"]}
            />
          </section>
          <section className="form-card source-card">
            <h3>
              Nguồn tham khảo <em>Bắt buộc</em>
            </h3>
            <p>Nguồn rõ ràng giúp đảm bảo tính chính xác lịch sử.</p>
            <textarea
              rows={5}
              value={sourceReferenceNote}
              onChange={(e) => setSourceReferenceNote(e.target.value)}
            />
          </section>
        </aside>
      </div>
      <div className="sticky-actions editor-sticky">
        <button
          className="secondary-button"
          onClick={() => navigate("lessons")}
        >
          Thoát trình soạn thảo
        </button>
        <span>{saving ? "Đang lưu vào database..." : "Sẵn sàng lưu"}</span>
      </div>
    </div>
  )
}

export function ReviewModal({
  isOpen,
  onClose,
  lessonTitle,
  lessonSummary,
  onApprove,
  onReject,
}: {
  isOpen: boolean
  onClose: () => void
  lessonTitle: string
  lessonSummary?: string
  onApprove: () => void
  onReject: (reason: string) => void
}) {
  const [rejectReason, setRejectReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Kiểm duyệt bài học: "{lessonTitle}"</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {!isRejecting ? (
            <>
              <div
                style={{
                  background: "#f8f9fa",
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: "#374151",
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ display: "block", marginBottom: 6 }}>
                  Tóm tắt từ dữ liệu bài học:
                </strong>
                <p style={{ margin: 0 }}>
                  {lessonSummary && lessonSummary.trim()
                    ? lessonSummary
                    : "Chưa có nội dung tóm tắt từ backend. Bài học sẽ hiển thị dữ liệu thực khi được lưu vào hệ thống."}
                </p>
              </div>

              <div className="modal-footer" style={{ gap: 12 }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsRejecting(true)}
                  style={{ color: "#c54646" }}
                >
                  Từ chối phê duyệt
                </button>
                <button
                  type="button"
                  className="primary-button"
                  style={{ background: "#287056" }}
                  onClick={() => {
                    onApprove()
                    onClose()
                  }}
                >
                  ✓ Duyệt & Xuất bản (PATCH /lessons/approve)
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="field">
                <span>
                  Lý do từ chối <b>*</b>
                </span>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Vui lòng nêu rõ các điểm cần chỉnh sửa hoặc lý do chưa đạt..."
                  required
                />
              </label>
              <div className="modal-footer" style={{ gap: 10 }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsRejecting(false)}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    if (!rejectReason.trim()) {
                      alert("Vui lòng nhập lý do từ chối!")
                      return
                    }
                    onReject(rejectReason)
                    setIsRejecting(false)
                    onClose()
                  }}
                >
                  Xác nhận Từ chối (PATCH /lessons/reject)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

type ReviewLessonRow = {
  id: string
  title: string
  topic: string
  author: string
  date: string
  summary: string
  status: "Chờ duyệt" | "Đã duyệt" | "Bị từ chối"
  rawStatus?: string
  rejectionReason?: string | null
}

export function ReviewPage() {
  const [tab, setTab] = useState("Chờ duyệt")
  const [selectedLesson, setSelectedLesson] = useState<ReviewLessonRow | null>(null)
  const [lessonsList, setLessonsList] = useState<ReviewLessonRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchLessonsForReview = async () => {
      try {
        setLoading(true)
        const response = await api.get("/lessons", {
          params: { page: 1, limit: 100 },
        })

        const items = response.data?.items || response.data?.data || []

        const mapped = (Array.isArray(items) ? items : []).map((lesson: any) => {
          const rawStatus = lesson.status || "DRAFT"
          const statusMap: Record<string, ReviewLessonRow["status"]> = {
            DRAFT: "Chờ duyệt",
            PENDING_REVIEW: "Chờ duyệt",
            PUBLISHED: "Đã duyệt",
            REJECTED: "Bị từ chối",
            ARCHIVED: "Bị từ chối",
          }

          const summary = (lesson.contentRichText || "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()

          return {
            id: lesson.id,
            title: lesson.title || "Không có tiêu đề",
            topic: lesson.topic?.name || "Chưa có chủ đề",
            author:
              lesson.creator?.username ||
              lesson.creator?.email ||
              "N/A",
            date: lesson.createdAt
              ? new Date(lesson.createdAt).toLocaleDateString("vi-VN")
              : "-",
            summary: summary.length > 220 ? `${summary.slice(0, 220)}...` : summary,
            status: statusMap[rawStatus] || "Chờ duyệt",
            rawStatus,
            rejectionReason: lesson.rejectionReason || null,
          }
        })

        setLessonsList(mapped)
      } catch (error) {
        console.error("Failed to fetch review lessons:", error)
        setLessonsList([])
      } finally {
        setLoading(false)
      }
    }

    fetchLessonsForReview()
  }, [])

  const handleApprove = async (lesson: ReviewLessonRow) => {
    try {
      await api.patch(`/lessons/${lesson.id}/review`, {
        status: "PUBLISHED",
      })

      setLessonsList((prev) =>
        prev.map((item) =>
          item.id === lesson.id
            ? { ...item, status: "Đã duyệt", rawStatus: "PUBLISHED" }
            : item,
        ),
      )

      alert(`Đã phê duyệt bài học "${lesson.title}" thành công!`)
    } catch (error) {
      console.error("Approve lesson failed:", error)
      alert("Không thể duyệt bài học. Vui lòng kiểm tra quyền admin và token.")
    }
  }

  const handleReject = async (lesson: ReviewLessonRow, reason: string) => {
    try {
      await api.patch(`/lessons/${lesson.id}/review`, {
        status: "REJECTED",
        rejectionReason: reason,
      })

      setLessonsList((prev) =>
        prev.map((item) =>
          item.id === lesson.id
            ? {
                ...item,
                status: "Bị từ chối",
                rawStatus: "REJECTED",
                rejectionReason: reason,
              }
            : item,
        ),
      )

      alert(`Đã từ chối bài học "${lesson.title}". Lý do: ${reason}`)
    } catch (error) {
      console.error("Reject lesson failed:", error)
      alert("Không thể từ chối bài học. Vui lòng kiểm tra quyền admin và token.")
    }
  }

  const normalizedSearch = search.trim().toLowerCase()
  const filtered = lessonsList.filter((item) => {
    const matchesTab = item.status === tab
    const matchesSearch =
      !normalizedSearch ||
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.topic.toLowerCase().includes(normalizedSearch)

    return matchesTab && matchesSearch
  })

  return (
    <div className="panel management-panel">
      <div className="tabs">
        {["Chờ duyệt", "Đã duyệt", "Bị từ chối"].map((x) => (
          <button
            key={x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </div>
      <div className="toolbar">
        <label className="search-box">
          <Icon name="search" size={17} />
          <input
            placeholder="Tìm bài học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="filters">
          <button>
            <Icon name="filter" size={14} />
            Chủ đề<span>⌄</span>
          </button>
          <button>
            Ngày gửi<span>⌄</span>
          </button>
        </div>
      </div>
      <div className="table-scroll">
        <table className="management-table">
          <thead>
            <tr>
              <th>BÀI HỌC</th>
              <th>CHỦ ĐỀ</th>
              <th>NGƯỜI TẠO</th>
              <th>NGÀY GỬI</th>
              <th>TRẠNG THÁI / NGUỒN</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                  Đang tải dữ liệu bài học từ server...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                  Không có bài học nào trong danh sách "{tab}".
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.title}</strong>
                  </td>
                  <td>{r.topic}</td>
                  <td>
                    <UserCell initials="NA" name={r.author} />
                  </td>
                  <td>{r.date}</td>
                  <td>
                    <span className="source-ok">✓ Đã cung cấp</span>
                  </td>
                  <td>
                    <button
                      className="review-button"
                      onClick={() => setSelectedLesson(r)}
                    >
                      <Icon name="eye" size={16} /> Xem & duyệt
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>{filtered.length} bài học</span>
        <div>
          <button className="selected">1</button>
        </div>
      </div>

      <ReviewModal
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        lessonTitle={selectedLesson?.title || ""}
        lessonSummary={selectedLesson?.summary || ""}
        onApprove={() => selectedLesson && handleApprove(selectedLesson)}
        onReject={(reason) =>
          selectedLesson && handleReject(selectedLesson, reason)
        }
      />
    </div>
  )
}

interface EventItem {
  id: string
  name: string
  topic: string
  year: string
  description: string
  location?: string
}

const initialEvents: EventItem[] = [
  {
    id: "evt-1",
    name: "Chiến thắng Điện Biên Phủ",
    topic: "Chiến dịch Điện Biên Phủ",
    year: "1954",
    description:
      "Chiến thắng lẫy lừng năm châu, chấn động địa cầu kết thúc 9 năm kháng chiến chống Pháp.",
  },
  {
    id: "evt-2",
    name: "Mở màn chiến dịch",
    topic: "Chiến dịch Điện Biên Phủ",
    year: "13/03/1954",
    description:
      "Quân ta nổ súng tiến công cứ điểm Him Lam, mở màn chiến dịch.",
  },
  {
    id: "evt-3",
    name: "Đợt tiến công thứ hai",
    topic: "Chiến dịch Điện Biên Phủ",
    year: "30/03/1954",
    description:
      "Tiến công đồng loạt các cứ điểm phía Đông phân khu trung tâm.",
  },
]

export function EventModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<EventItem, "id">) => void
  initialData?: EventItem | null
}) {
  const [name, setName] = useState(initialData?.name || "")
  const [topic, setTopic] = useState(
    initialData?.topic || "Chiến dịch Điện Biên Phủ",
  )
  const [year, setYear] = useState(initialData?.year || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [location, setLocation] = useState(initialData?.location || "")

  useMemo(() => {
    if (isOpen) {
      setName(initialData?.name || "")
      setTopic(initialData?.topic || "Chiến dịch Điện Biên Phủ")
      setYear(initialData?.year || "")
      setDescription(initialData?.description || "")
      setLocation(initialData?.location || "")
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name, topic, year, description, location })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {initialData
              ? "Chỉnh sửa sự kiện lịch sử"
              : "Thêm sự kiện lịch sử mới"}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <label className="field">
            <span>
              Tên sự kiện <b>*</b>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Chiến thắng Điện Biên Phủ"
              required
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>
                Chủ đề lịch sử <b>*</b>
              </span>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="modal-select"
              >
                <option value="Chiến dịch Điện Biên Phủ">
                  Chiến dịch Điện Biên Phủ
                </option>
                <option value="Cách mạng tháng Tám">Cách mạng tháng Tám</option>
                <option value="Kháng chiến toàn quốc">
                  Kháng chiến toàn quốc
                </option>
                <option value="Hiệp định Genève 1954">
                  Hiệp định Genève 1954
                </option>
              </select>
            </label>
            <label className="field">
              <span>
                Mốc thời gian / Năm <b>*</b>
              </span>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Ví dụ: 07/05/1954 hoặc 1954"
                required
              />
            </label>
          </div>
          <label className="field">
            <span>Địa điểm</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ví dụ: Sông Bạch Đằng, Quảng Ninh"
            />
          </label>
          <label className="field">
            <span>Mô tả tóm tắt sự kiện</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập tóm tắt diễn biến hoặc ý nghĩa của mốc sự kiện..."
            />
          </label>
          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Hủy
            </button>
            <button type="submit" className="primary-button">
              {initialData ? "Cập nhật sự kiện" : "Lưu sự kiện mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
}) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container modal-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Xác nhận xóa sự kiện</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="delete-warn-text">
            Bạn có chắc chắn muốn xóa sự kiện <strong>"{title}"</strong> không?
            Thao tác này không thể hoàn tác.
          </p>
          <div className="modal-footer">
            <button className="secondary-button" onClick={onClose}>
              Hủy bỏ
            </button>
            <button
              className="danger-button"
              onClick={() => {
                onConfirm()
                onClose()
              }}
            >
              Xóa sự kiện
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SimplePage({ type, navigate }: { type: string; navigate?: (p: string) => void }) {
  const [eventsList, setEventsList] = useState<EventItem[]>([])
  const [tagsList, setTagsList] = useState<
    Array<{ id: string; name: string; description?: string; colorHex?: string }>
  >([])
  const [topics, setTopics] = useState<Array<{ id: string; name: string }>>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
  const [editingTag, setEditingTag] = useState<
    { id: string; name: string; description?: string; colorHex?: string } | null
  >(null)
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const isEvents = type === "events"
  const isTags = type === "tags"

  const fetchTopics = async () => {
    try {
      const res = await api.get("/topics")
      const payload = res.data?.items || res.data?.data || res.data || []
      setTopics(Array.isArray(payload) ? payload : [])
    } catch (err) {
      console.error("Failed to load topics for event form:", err)
      setTopics([])
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await api.get("/historical-events")
      const payload = res.data?.items || res.data?.data || res.data || []
      const list = Array.isArray(payload) ? payload : []
      setEventsList(
        list.map((evt: any) => ({
          id: evt.id,
          name: evt.title,
          topic: evt.topic?.name || evt.topicName || "Chủ đề chưa gán",
          topicId: evt.topicId || "",
          year: String(evt.eventYear ?? ""),
          description: evt.description || "",
          location: evt.location || "",
        })),
      )
    } catch (err) {
      console.error("Failed to load events:", err)
      setEventsList([])
    }
  }

  const fetchTags = async () => {
    try {
      const res = await api.get("/tags")
      const payload = res.data?.items || res.data?.data || res.data || []
      const list = Array.isArray(payload) ? payload : []
      setTagsList(
        list.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          description: tag.description || "",
          colorHex: tag.colorHex || "#6b7280",
        })),
      )
    } catch (err) {
      console.error("Failed to load tags:", err)
      setTagsList([])
    }
  }

  useEffect(() => {
    if (isEvents) {
      fetchTopics()
      fetchEvents()
    }
    if (isTags) {
      fetchTags()
    }
  }, [type])

  const handleSaveEvent = async (data: Omit<EventItem, "id">) => {
    const selectedTopicId =
      topics.find((topic) => topic.name === data.topic)?.id || topics[0]?.id

    if (!selectedTopicId) {
      alert("Không có chủ đề nào trong hệ thống để lưu sự kiện.")
      return
    }

    const cleanYear = Number(data.year)
    if (!data.name.trim() || Number.isNaN(cleanYear)) {
      alert("Vui lòng nhập tên sự kiện và năm sự kiện hợp lệ.")
      return
    }

    const payload = {
      topicId: selectedTopicId,
      title: data.name.trim(),
      eventYear: cleanYear,
      description: data.description?.trim() || undefined,
      location: data.location?.trim() || undefined,
      displayOrder: 0,
    }

    try {
      if (editingEvent) {
        await api.patch(`/historical-events/${editingEvent.id}`, payload)
      } else {
        await api.post("/historical-events", payload)
      }
      await fetchEvents()
      setIsModalOpen(false)
      setEditingEvent(null)
    } catch (err: any) {
      console.error("Failed to save event:", err)
      alert(
        err?.response?.data?.message ||
          "Không thể lưu sự kiện. Vui lòng kiểm tra dữ liệu hoặc quyền truy cập.",
      )
    }
  }

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return

    try {
      await api.delete(`/historical-events/${deletingEvent.id}`)
      await fetchEvents()
      setDeletingEvent(null)
    } catch (err: any) {
      console.error("Failed to delete event:", err)
      alert(err?.response?.data?.message || "Xóa sự kiện thất bại.")
    }
  }

  const handleSaveTag = async (payload: {
    name: string
    description?: string
    colorHex?: string
  }) => {
    try {
      if (editingTag) {
        await api.patch(`/tags/${editingTag.id}`, payload)
      } else {
        await api.post("/tags", payload)
      }
      await fetchTags()
      setIsTagModalOpen(false)
      setEditingTag(null)
    } catch (err: any) {
      console.error("Failed to save tag:", err)
      alert(err?.response?.data?.message || "Không thể lưu thẻ.")
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    try {
      await api.delete(`/tags/${tagId}`)
      await fetchTags()
    } catch (err: any) {
      console.error("Failed to delete tag:", err)
      alert(err?.response?.data?.message || "Xóa thẻ thất bại.")
    }
  }

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return eventsList
    const q = searchQuery.toLowerCase()
    return eventsList.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.topic.toLowerCase().includes(q) ||
        e.year.includes(q),
    )
  }, [eventsList, searchQuery])

  return (
    <div className="panel simple-state">
      <div className="toolbar">
        <label className="search-box">
          <Icon name="search" size={17} />
          <input
            placeholder={isEvents ? "Tìm sự kiện lịch sử..." : "Tìm kiếm..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
        <div className="filters">
          <button>
            <Icon name="filter" size={14} />
            Bộ lọc<span>⌄</span>
          </button>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            if (isEvents) {
              setEditingEvent(null)
              setIsModalOpen(true)
            }
            if (isTags) {
              if (navigate) {
                navigate("tags/create")
                return
              }
              setEditingTag(null)
              setIsTagModalOpen(true)
            }
          }}
        >
          <Icon name="plus" size={17} />
          {isEvents ? "Thêm sự kiện mới" : "Thêm thẻ mới"}
        </button>
      </div>

      <div className="simple-list">
        {isEvents
          ? filteredEvents.map((evt) => (
              <div key={evt.id} className="event-row-item">
                <span className="simple-icon">
                  <Icon name="calendar" />
                </span>
                <div className="event-info-col">
                  <strong>{evt.name}</strong>
                  <p>
                    {evt.topic} ·{" "}
                    <span className="event-year-tag">{evt.year}</span>
                  </p>
                  {evt.description && (
                    <small className="event-desc-text">{evt.description}</small>
                  )}
                </div>
                <Badge tone="green">Published</Badge>
                <div className="item-actions">
                  <button
                    className="icon-action-btn edit-btn"
                    title="Chỉnh sửa sự kiện"
                    onClick={() => {
                      setEditingEvent(evt)
                      setIsModalOpen(true)
                    }}
                  >
                    <Icon name="edit" size={15} />
                  </button>
                  <button
                    className="icon-action-btn delete-btn"
                    title="Xóa sự kiện"
                    onClick={() => setDeletingEvent(evt)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            ))
          : isTags
            ? tagsList.map((tag) => (
                <div key={tag.id}>
                  <span className="simple-icon" style={{ background: tag.colorHex || "#dbeafe" }}>
                    <Icon name="tag" />
                  </span>
                  <div>
                    <strong>{tag.name}</strong>
                    <p>{tag.description || "Chưa có mô tả"}</p>
                  </div>
                  <Badge tone="green">Published</Badge>
                  <ActionMenu
                    onEdit={() => {
                      setEditingTag(tag)
                      setIsTagModalOpen(true)
                    }}
                    onDelete={() => handleDeleteTag(tag.id)}
                  />
                </div>
              ))
            : null}
      </div>

      {isEvents && (
        <>
          <EventModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveEvent}
            initialData={editingEvent}
          />
          <ConfirmDeleteModal
            isOpen={!!deletingEvent}
            onClose={() => setDeletingEvent(null)}
            onConfirm={handleDeleteEvent}
            title={deletingEvent?.name || ""}
          />
        </>
      )}

      {isTags && (
        <TagModal
          isOpen={isTagModalOpen}
          onClose={() => {
            setIsTagModalOpen(false)
            setEditingTag(null)
          }}
          onSave={handleSaveTag}
          initialData={editingTag}
        />
      )}
    </div>
  )
}

export function TagModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { name: string; description?: string; colorHex?: string }) => void
  initialData?: { id: string; name: string; description?: string; colorHex?: string } | null
}) {
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")

  useMemo(() => {
    if (isOpen) {
      setName(initialData?.name || "")
      setDescription(initialData?.description || "")
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? "Chỉnh sửa thẻ" : "Thêm thẻ mới"}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <label className="field">
            <span>
              Tên thẻ <b>*</b>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Kháng chiến, Pháp, Địa danh"
              required
            />
          </label>

          <label className="field">
            <span>Mô tả</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả ngắn về thẻ..."
            />
          </label>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="primary-button">
              {initialData ? "Cập nhật thẻ" : "Lưu thẻ mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState("dashboard")
  const [mobileNav, setMobileNav] = useState(false)
  const rootPage = page.includes("period")
    ? "periods"
    : page.includes("topic")
      ? "topics"
      : page.includes("lesson")
        ? "lessons"
        : page
  const meta =
    page === "period-form"
      ? {
          title: "Thêm giai đoạn lịch sử",
          subtitle: "Tạo giai đoạn mới trong hệ thống nội dung",
        }
      : page === "topic-form"
        ? {
            title: "Thêm chủ đề lịch sử",
            subtitle: "Tạo chủ đề thuộc một giai đoạn lịch sử",
          }
        : page === "lesson-editor"
          ? {
              title: "Tạo bài học",
              subtitle: "Biên soạn nội dung học tập lịch sử",
            }
          : pageMeta[page] || pageMeta.dashboard
  return (
    <div className="app-shell">
      <Sidebar
        page={rootPage}
        setPage={setPage}
        open={mobileNav}
        close={() => setMobileNav(false)}
      />
      <div className="main-shell">
        <Topbar page={rootPage} openNav={() => setMobileNav(true)} />
        <main className="page">
          <div className="page-title">
            <div>
              <div className="eyebrow">
                {page !== rootPage && (
                  <>
                    <button onClick={() => setPage(rootPage)}>
                      {pageMeta[rootPage]?.title}
                    </button>
                    <Icon name="chevron" size={12} />
                  </>
                )}
              </div>
              <h1>{meta.title}</h1>
              <p>{meta.subtitle}</p>
            </div>
            {page === "dashboard" && (
              <div className="date-chip">
                <Icon name="calendar" size={16} />
                <div>
                  <span>Hôm nay</span>
                  <strong>Thứ Tư, 23/09/2026</strong>
                </div>
              </div>
            )}
          </div>
          {page === "dashboard" && <Dashboard navigate={setPage} />}
          {["periods", "topics", "lessons"].includes(page) && (
            <ManagementPage type={page} navigate={setPage} />
          )}
          {page === "period-form" && (
            <FormPage kind="period" navigate={setPage} />
          )}
          {page === "topic-form" && (
            <FormPage kind="topic" navigate={setPage} />
          )}
          {page === "lesson-editor" && <LessonEditor navigate={setPage} />}
          {page === "review" && <ReviewPage />}
          {["events", "tags", "users"].includes(page) && (
            <SimplePage type={page} />
          )}
        </main>
      </div>
    </div>
  )
}
