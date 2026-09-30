'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { Badge } from '@/components/common/Badge';
import { StatCard } from '@/components/common/StatCard';
import { ContentCell } from '@/components/common/ContentCell';
import { UserCell } from '@/components/common/UserCell';
import { ActionMenu } from '@/components/common/ActionMenu';
import { QuickAction } from '@/components/common/QuickAction';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';

export function DashboardView() {
  const router = useRouter();

  return (
    <>
      <section className="stats-grid">
        <StatCard
          icon={IconName.CLOCK}
          value="12"
          label="Giai đoạn lịch sử"
          detail="so với tháng trước"
          tone="blue"
        />
        <StatCard
          icon={IconName.FOLDER}
          value="48"
          label="Chủ đề"
          detail="4 chủ đề mới"
          tone="gold"
        />
        <StatCard
          icon={IconName.BOOK}
          value="126"
          label="Bài học"
          detail="8 bài học mới"
          tone="green"
        />
        <StatCard
          icon={IconName.CHECK}
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
            <button
              type="button"
              className="text-button"
              onClick={() => router.push(APP_ROUTES.LESSONS.LIST)}
            >
              Xem tất cả <Icon name={IconName.ARROW} size={15} />
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
                      icon={IconName.BOOK}
                      title="Chiến dịch Điện Biên Phủ"
                      sub="Chiến dịch Điện Biên Phủ"
                    />
                  </td>
                  <td>Bài học</td>
                  <td>
                    <Badge tone="gray">Draft</Badge>
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
                      icon={IconName.CLOCK}
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
                      icon={IconName.FOLDER}
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
                      icon={IconName.BOOK}
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
                      icon={IconName.CALENDAR}
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
              <button
                type="button"
                className="count-pill"
                onClick={() => router.push(APP_ROUTES.REVIEW)}
              >
                8
              </button>
            </div>
            {[
              [
                'Chiến dịch Điện Biên Phủ năm 1954',
                'Chiến dịch Điện Biên Phủ',
                'Nguyễn Văn A',
                '22/09/2026',
              ],
              [
                'Nguyên nhân bùng nổ Toàn quốc kháng chiến',
                'Kháng chiến toàn quốc',
                'Mai Trang',
                '21/09/2026',
              ],
              [
                'Nội dung Hiệp định Genève',
                'Hiệp định Genève',
                'Lê Hoàng',
                '20/09/2026',
              ],
            ].map((x, i) => (
              <div className="pending-item" key={x[0]}>
                <div className="pending-index">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <strong>{x[0]}</strong>
                  <span>{x[1]}</span>
                  <small>
                    {x[2]} · {x[3]}
                  </small>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(APP_ROUTES.REVIEW)}
                >
                  <Icon name={IconName.EYE} size={16} /> Duyệt
                </button>
              </div>
            ))}
            <button
              type="button"
              className="panel-footer"
              onClick={() => router.push(APP_ROUTES.REVIEW)}
            >
              Xem tất cả bài chờ duyệt <Icon name={IconName.ARROW} size={15} />
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
                icon={IconName.CLOCK}
                label="Thêm giai đoạn"
                onClick={() => router.push(APP_ROUTES.PERIODS.CREATE)}
              />
              <QuickAction
                icon={IconName.FOLDER}
                label="Thêm chủ đề"
                onClick={() => router.push(APP_ROUTES.TOPICS.CREATE)}
              />
              <QuickAction
                icon={IconName.BOOK}
                label="Tạo bài học"
                primary
                onClick={() => router.push(APP_ROUTES.LESSONS.CREATE)}
              />
              <QuickAction
                icon={IconName.CALENDAR}
                label="Thêm sự kiện"
                onClick={() => router.push(APP_ROUTES.EVENTS.CREATE)}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
