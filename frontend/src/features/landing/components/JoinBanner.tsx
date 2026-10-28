'use client';

import { ArrowRight, BookOpen, Check, Globe2, GraduationCap, History, MapPin, ShieldCheck, Users } from 'lucide-react';
import { useAuthSession } from '@/services/auth/useAuthSession';
import { LANDING_ROUTES } from '../landing.adapter';
import type { LandingStats } from '../landing.types';
import { HlBadge, HlButton, Reveal } from './LandingUi';

const BENEFITS = [
  'Đăng ký lộ trình học miễn phí',
  'Lưu tiến độ từng bài trên mọi thiết bị',
  'Đọc trọn bài học kèm nguồn tư liệu',
];

export function JoinBanner() {
  const user = useAuthSession();
  return (
    <section className="hl-section hl-container">
      <Reveal className="hl-join">
        <div className="hl-join-grid">
          <div className="hl-join-copy">
            <span className="hl-join-icon">
              <Globe2 />
            </span>
            <HlBadge>Việt Nam trong dòng chảy thế giới</HlBadge>
            <h2>
              Đừng chỉ đọc lịch sử.
              <br />
              <em>Hãy đi cùng nó.</em>
            </h2>
            <p>
              Từ Văn Lang đến thế giới hiện đại: học theo lộ trình, đối sánh các khu vực và hiểu vì sao mỗi sự kiện
              xảy ra đúng lúc ấy.
            </p>
            <div className="hl-join-proof">
              <ShieldCheck />
              <span>
                <strong>Nội dung được biên tập & duyệt bởi hai người</strong>
                <small>Mỗi bài học đều qua biên tập viên và người duyệt độc lập.</small>
              </span>
            </div>
          </div>
          <div className="hl-join-card">
            {user ? (
              <>
                <h3>Chào mừng trở lại, {user.username}</h3>
                <p>Tiếp tục lộ trình đang học hoặc tìm một thời kỳ mới để khám phá.</p>
                <HlButton href="/tai-khoan#hoc-tap" variant="gold">
                  Lộ trình của tôi <ArrowRight />
                </HlButton>
                <HlButton href={LANDING_ROUTES.CURRICULUM} variant="outline" className="hl-join-secondary">
                  Khám phá lộ trình khác
                </HlButton>
              </>
            ) : (
              <>
                <h3>Tài khoản miễn phí mang lại cho bạn</h3>
                <ul>
                  {BENEFITS.map((b) => (
                    <li key={b}>
                      <span>
                        <Check />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <HlButton href="/dang-ky" variant="gold">
                  Tạo tài khoản miễn phí <ArrowRight />
                </HlButton>
                <HlButton href="/login?redirect=%2F" variant="outline" className="hl-join-secondary">
                  Tôi đã có tài khoản
                </HlButton>
              </>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function StatsStrip({ stats }: { stats: LandingStats }) {
  const items = [
    { icon: History, value: stats.events, label: 'Mốc sự kiện' },
    { icon: Users, value: stats.figures, label: 'Nhân vật lịch sử' },
    { icon: MapPin, value: stats.locations, label: 'Di tích & địa danh' },
    { icon: GraduationCap, value: stats.paths, label: 'Lộ trình học' },
    { icon: BookOpen, value: stats.regions, label: 'Vùng lịch sử' },
  ];
  return (
    <div className="hl-stats-strip">
      <div className="hl-container hl-stats-grid">
        {items.map((s) => (
          <div key={s.label}>
            <span>
              <s.icon />
            </span>
            <div>
              <strong>{s.value.toLocaleString('vi-VN')}</strong>
              <small>{s.label}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
