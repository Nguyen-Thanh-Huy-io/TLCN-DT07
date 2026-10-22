'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, GraduationCap, Landmark, Users } from 'lucide-react';
import { LANDING_ROUTES } from '../landing.adapter';
import type { LandingEra, LandingStats } from '../landing.types';
import { HlBadge, HlButton, HlCover, Reveal, SectionHead } from './LandingUi';

export function CorePillars({ stats }: { stats: LandingStats }) {
  const pillars = [
    {
      icon: Compass,
      no: '01',
      title: 'Dòng thời gian Đa tầng',
      text: 'Duyệt ngang & dọc, lọc theo quốc gia / khu vực và đặt Việt Nam cạnh thế giới trong cùng lát cắt.',
      href: LANDING_ROUTES.TIMELINE,
      meta: `${stats.events} mốc sự kiện`,
      color: 'red',
    },
    {
      icon: Users,
      no: '02',
      title: 'Nhân vật làm nên thời đại',
      text: 'Hồ sơ, vai trò trong từng sự kiện và mạng quan hệ giữa các nhân vật lịch sử.',
      href: LANDING_ROUTES.FIGURES,
      meta: `${stats.figures} hồ sơ nhân vật`,
      color: 'green',
    },
    {
      icon: Landmark,
      no: '03',
      title: 'Di tích & Địa danh',
      text: 'Những không gian còn lưu dấu sự kiện — nơi lịch sử đã thực sự diễn ra.',
      href: LANDING_ROUTES.LOCATIONS,
      meta: `${stats.locations} địa danh`,
      color: 'blue',
    },
    {
      icon: GraduationCap,
      no: '04',
      title: 'Chương trình học',
      text: 'Lộ trình phân chương, bài đọc có trích dẫn nguồn và theo dõi tiến độ của riêng bạn.',
      href: LANDING_ROUTES.CURRICULUM,
      meta: `${stats.paths} lộ trình`,
      color: 'gold',
    },
  ];

  return (
    <section className="hl-section hl-container">
      <SectionHead
        eyebrow="Hệ sinh thái HISGO"
        title="Bốn lối vào lịch sử"
        description="Chọn cách khám phá phù hợp với nhịp học và sự tò mò của riêng bạn."
      />
      <div className="hl-pillar-grid">
        {pillars.map((p) => (
          <Reveal key={p.title}>
            <motion.div whileHover={{ y: -7 }}>
              <Link href={p.href} className={`hl-pillar-card ${p.color}`}>
                <span className="hl-pillar-no">{p.no}</span>
                <span className="hl-pillar-icon">
                  <p.icon />
                </span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <div>
                  <span>{p.meta}</span>
                  <ArrowRight />
                </div>
              </Link>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function EraBento({ eras }: { eras: LandingEra[] }) {
  if (eras.length === 0) return null;
  return (
    <section className="hl-section hl-era-section" id="explore">
      <div className="hl-container">
        <SectionHead
          eyebrow="Khám phá theo thời kỳ"
          title={`Hành trình qua ${eras.length} kỷ nguyên`}
          description="Việt Nam và thế giới, mỗi thời kỳ là một lớp ký ức — với sự kiện, con người và không gian đan cài."
          action={
            <HlButton href={LANDING_ROUTES.TIMELINE} variant="ghost">
              Xem toàn bộ niên biểu
              <ArrowRight />
            </HlButton>
          }
        />
        <div className="hl-bento-grid">
          {eras.map((era) => (
            <Reveal className={`hl-bento-item ${era.size}`} key={era.id}>
              <motion.div whileHover={{ y: -4 }} className="hl-bento-hover">
                <Link className="hl-era-card" href={era.href}>
                  <HlCover src={era.imageUrl} alt="" fallbackText={era.region} />
                  <div className="hl-era-shade" />
                  <div className="hl-era-top">
                    <HlBadge>{era.years}</HlBadge>
                    <span>
                      <ArrowRight />
                    </span>
                  </div>
                  <div className="hl-era-content">
                    <p>
                      {era.region} • {era.eventCount} sự kiện • {era.figureCount} nhân vật
                    </p>
                    <h3>{era.name}</h3>
                    {era.subEras.length > 0 && (
                      <div className="hl-suberas">
                        {era.subEras.map((s) => (
                          <span key={s}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
