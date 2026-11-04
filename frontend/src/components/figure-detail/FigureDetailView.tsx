"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Clock3,
  Feather,
  Landmark,
  Link2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { PUBLIC_ROUTE_PREFIX, type PublicLessonSummaryDto, type PublicPeriodDto } from "@/services/entities/landing.service";
import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { FigurePortrait } from "@/components/figures/FigurePortrait";
import { RelationshipGraph } from "@/components/figures/RelationshipGraph";
import { figureRoles, useFigureRoles } from "@/components/figures/figure-roles";
import type { FigureView } from "@/components/figures/figure-utils";
import { usePublicTaxonomyTerms } from "@/features/taxonomy/usePublicTaxonomy";
import { buildLessonTocAndHtml, normalizeContentToBlocks } from "@/features/lessons/utils/lesson-toc.util";
import { FigureInfobox } from "./FigureInfobox";
import { LifeTimelineAxis } from "./LifeTimelineAxis";
import "@/components/event-detail/ce-event.css";
import "@/components/figures/sk-figures.css";
import "./figure-detail.css";

/** Mục lục bấm sáng theo vị trí đang cuộn + thanh % tiến độ — giống StickyToc của trang sự kiện. */
function StickyToc({
  sections,
  activeId,
  progress,
}: {
  sections: Array<{ id: string; title: string }>;
  activeId: string;
  progress: number;
}) {
  return (
    <aside className="ce-toc ce-sticky-card">
      <div className="ce-toc-title">
        <span>NỘI DUNG HỒ SƠ</span>
        <strong>{Math.round(progress)}%</strong>
      </div>
      <nav>
        <div className="ce-toc-progress">
          <i style={{ height: `${progress}%` }} />
        </div>
        {sections.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={activeId === s.id ? "ce-active" : ""}
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            <span />
            {String(i + 1).padStart(2, "0")}. {s.title}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="ce-article-section">
      <span className="ce-section-number">{eyebrow}</span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

/**
 * Trang chi tiết nhân vật (/nhan-vat/[slug]) — dùng chung ngôn ngữ thiết kế "ce-" với
 * trang chi tiết sự kiện (/su-kien/[slug]) thay vì bảng màu riêng của modal "Hồ sơ nhân
 * vật" (FigureProfileSheet) — 2 theme khác nhau cắm cạnh nhau trên cùng 1 trang là lý do
 * giao diện cũ trông lộn xộn. 7 mục: Hero, Thông tin nhanh, Tiểu sử, Dòng thời gian, Mối
 * quan hệ, Sự kiện liên quan, Tài liệu tham khảo.
 */
export function FigureDetailView({
  figure,
  directory,
  periods,
  lessons = [],
}: {
  figure: FigureView;
  directory: FigureView[];
  periods: PublicPeriodDto[];
  lessons?: PublicLessonSummaryDto[];
}) {
  const router = useRouter();
  const { label: roleLabel } = useFigureRoles();
  const roles = figureRoles(figure.roles).map(roleLabel);
  const relationTerms = usePublicTaxonomyTerms("ENTITY_RELATION");
  const period = periods.find((p) => p.slug === figure.subEraSlug || p.slug === figure.periodSlug);
  const legacy = figure.legacy;
  const bioParagraphs = (figure.biography || figure.description || "").split(/\n{2,}/).filter(Boolean);
  // Tiểu sử dạng khối (Block Builder — hỗ trợ chèn ảnh/video/timeline...), biên dịch ra HTML
  // ngay trên trang công khai giống cách bài học hiển thị. Chưa có khối nào → rơi về đoạn
  // văn thuần `biography` ở trên (dữ liệu cũ/nhân vật chưa soạn lại bằng Block Builder).
  const bioHtml = useMemo(() => {
    const { blocks } = normalizeContentToBlocks(figure.contentBlocks);
    if (blocks.length === 0) return "";
    return buildLessonTocAndHtml(blocks).html;
  }, [figure.contentBlocks]);
  const hasBio = Boolean(bioHtml) || bioParagraphs.length > 0 || Boolean(legacy.backgroundAndYouth) || legacy.notableWorks.length > 0;
  const hasEvents = figure.events.length > 0;
  const hasRelationships = figure.relationships.length > 0;
  const hasSources = figure.sources.length > 0;
  const hasLessons = lessons.length > 0;

  // Mục lục chỉ liệt kê những mục thực sự có nội dung — hồ sơ mỗi nhân vật dữ liệu khác
  // nhau nên không nên luôn hiện đủ 6-7 mục cố định như trước.
  const sections = [
    { id: "thong-tin-nhanh", title: "Thông tin nhanh", show: true },
    { id: "tieu-su", title: "Tiểu sử & sự nghiệp", show: hasBio },
    { id: "dong-thoi-gian", title: "Dòng thời gian cuộc đời", show: hasEvents },
    { id: "moi-quan-he", title: "Mối quan hệ", show: hasRelationships },
    { id: "su-kien-lien-quan", title: "Sự kiện liên quan", show: hasEvents },
    { id: "tai-lieu", title: "Tài liệu tham khảo", show: hasSources },
    { id: "bai-hoc", title: "Bài học liên quan", show: hasLessons },
  ].filter((s) => s.show);
  const eyebrowOf = (id: string) => String(sections.findIndex((s) => s.id === id) + 1).padStart(2, "0");

  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const layoutRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });

  useEffect(() => {
    const nodes = sections.map((s) => document.getElementById(s.id)).filter((n): n is HTMLElement => n !== null);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActiveId(entry.target.id)),
      { rootMargin: "-22% 0px -62% 0px" },
    );
    nodes.forEach((n) => observer.observe(n));
    const onScroll = () => {
      const node = layoutRef.current;
      if (!node) return;
      const total = node.offsetHeight - window.innerHeight;
      const value = total > 0 ? ((window.scrollY - node.offsetTop) / total) * 100 : 100;
      setProgress(Math.max(0, Math.min(100, value)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [figure.id]);

  return (
    <div className="ce-app">
      <motion.div className="ce-reading-progress" style={{ scaleX }} />
      <Header />
      {/* ===== 1. HERO ===== */}
      <section className="ce-hero">
        <nav className="ce-breadcrumbs" aria-label="Đường dẫn">
          <Link href="/nhan-vat">Nhân vật</Link>
          {period && (
            <>
              <ChevronRight />
              <Link href={`${PUBLIC_ROUTE_PREFIX.PERIOD}/${period.slug}`}>{period.name}</Link>
            </>
          )}
          <ChevronRight />
          <span>{figure.name}</span>
        </nav>
        <div className="fig-hero-grid">
          <div>
            <div className="ce-hero-badges">
              {period && <span className="ce-badge">{period.name}</span>}
              {roles.map((r) => (
                <span className="ce-badge" key={r}>
                  {r}
                </span>
              ))}
            </div>
            <p className="ce-hero-date">
              <span />
              {figure.lifespanLabel}
            </p>
            <h1>{figure.name}</h1>
            {figure.aliases.length > 0 && <p className="ce-hero-deck">{figure.aliases.join(" · ")}</p>}
            {(figure.tagline || figure.description) && (
              <p className="ce-hero-deck">{figure.tagline || figure.description}</p>
            )}

            {/* Hàng thông tin nhanh: Thời đại · Triều đại · Vai trò · Lĩnh vực hoạt động */}
            <div className="fig-quickfacts">
              <div>
                <small>Niên đại</small>
                <strong>{figure.lifespanLabel}</strong>
              </div>
              {period && (
                <div>
                  <small>Triều đại / Thời kỳ</small>
                  <strong>{period.name}</strong>
                </div>
              )}
              {roles.length > 0 && (
                <div>
                  <small>Vai trò</small>
                  <strong>{roles.join(" · ")}</strong>
                </div>
              )}
              {figure.occupation && (
                <div>
                  <small>Lĩnh vực hoạt động</small>
                  <strong>{figure.occupation}</strong>
                </div>
              )}
            </div>

            <div className="ce-hero-meta">
              {figure.events.length > 0 && (
                <span>
                  <Clock3 /> {figure.events.length} sự kiện liên quan
                </span>
              )}
              {figure.relationships.length > 0 && (
                <span>
                  <Users /> {figure.relationships.length} mối quan hệ
                </span>
              )}
              {figure.sources.length > 0 && (
                <span>
                  <Link2 /> {figure.sources.length} tài liệu tham khảo
                </span>
              )}
            </div>
          </div>
          <figure className="fig-hero-portrait">
            <FigurePortrait figure={figure} />
          </figure>
        </div>
      </section>

      <div className="ce-reader-layout" ref={layoutRef}>
        <StickyToc sections={sections} activeId={activeId} progress={progress} />

        <article className="ce-article">
          {/* ===== THÔNG TIN NHANH ===== */}
          <Section id="thong-tin-nhanh" eyebrow={eyebrowOf("thong-tin-nhanh")} title="Thông tin nhanh">
            <div className="ce-insight-grid">
              <div style={{ padding: "20px 16px" }}>
                <Calendar />
                <strong>Thời gian hoạt động</strong>
                <p>{figure.lifespanLabel}</p>
              </div>
              {legacy.hometown && (
                <div style={{ padding: "20px 16px" }}>
                  <MapPin />
                  <strong>Quê hương</strong>
                  <p>{legacy.hometown}</p>
                </div>
              )}
              {period && (
                <div style={{ padding: "20px 16px" }}>
                  <Landmark />
                  <strong>Thời kỳ</strong>
                  <p>{period.name}</p>
                </div>
              )}
              {roles.length > 0 && (
                <div style={{ padding: "20px 16px" }}>
                  <Sparkles />
                  <strong>Vai trò</strong>
                  <p>{roles.join(" · ")}</p>
                </div>
              )}
            </div>
          </Section>

          {/* ===== TIỂU SỬ (chia chương, chỉ hiện khi có nội dung) ===== */}
          {hasBio && (
          <Section id="tieu-su" eyebrow={eyebrowOf("tieu-su")} title="Tiểu sử & sự nghiệp">
            {bioHtml ? (
              <div className="ce-bio-blocks" dangerouslySetInnerHTML={{ __html: bioHtml }} />
            ) : (
              <>
                {legacy.backgroundAndYouth && (
                  <>
                    <h3 className="ce-bio-chapter">Thân thế &amp; thiếu thời</h3>
                    <p>{legacy.backgroundAndYouth}</p>
                  </>
                )}

                {bioParagraphs.length > 0 && (
                  <>
                    <h3 className="ce-bio-chapter">Sự nghiệp</h3>
                    {bioParagraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </>
                )}
              </>
            )}

            {legacy.anecdotes.length > 0 && (
              <div className="ce-context-quote">
                <Sparkles />
                <blockquote>{legacy.anecdotes[0]}</blockquote>
                <small>— Giai thoại được kể lại</small>
              </div>
            )}

            {legacy.legacyAndHonors && (
              <>
                <h3 className="ce-bio-chapter">Di sản &amp; đánh giá</h3>
                <p>{legacy.legacyAndHonors}</p>
              </>
            )}

            {legacy.notableWorks.length > 0 && (
              <>
                <h3 className="ce-bio-chapter">Tác phẩm</h3>
                <div className="ce-child-list">
                  {legacy.notableWorks.map((w) => (
                    <span key={w} style={{ display: "block", padding: "10px 0" }}>
                      <Feather size={13} style={{ marginRight: 8, verticalAlign: -2 }} />
                      {w}
                    </span>
                  ))}
                </div>
              </>
            )}

          </Section>
          )}

          {/* ===== DÒNG THỜI GIAN ===== */}
          {hasEvents && (
          <Section id="dong-thoi-gian" eyebrow={eyebrowOf("dong-thoi-gian")} title="Dòng thời gian cuộc đời">
            <LifeTimelineAxis events={figure.events} />
          </Section>
          )}

          {/* ===== MỐI QUAN HỆ ===== */}
          {hasRelationships && (
          <Section id="moi-quan-he" eyebrow={eyebrowOf("moi-quan-he")} title="Mối quan hệ">
            <div className="sk-figure-profile" style={{ width: "auto", borderRadius: 14, border: "1px solid var(--ce-line)" }}>
              <RelationshipGraph
                figure={figure}
                directory={directory}
                onNavigate={(f) => router.push(`/nhan-vat/${f.slug}`)}
              />
            </div>
          </Section>
          )}

          {/* ===== SỰ KIỆN LIÊN QUAN ===== */}
          {hasEvents && (
          <Section id="su-kien-lien-quan" eyebrow={eyebrowOf("su-kien-lien-quan")} title="Sự kiện liên quan">
            <div className="ce-insight-grid">
                {figure.events.map((e) => (
                  <Link key={e.id} href={e.slug ? `${PUBLIC_ROUTE_PREFIX.EVENT}/${e.slug}` : "#"}>
                    <BookOpen />
                    <strong>{e.title}</strong>
                    <p>
                      {e.startYear < 0 ? `${Math.abs(e.startYear)} TCN` : `Năm ${e.startYear}`}
                      {" · "}
                      {e.roleLabel || e.role}
                    </p>
                    <ChevronRight className="ce-insight-chevron" />
                  </Link>
                ))}
            </div>
          </Section>
          )}

          {/* ===== TÀI LIỆU THAM KHẢO ===== */}
          {hasSources && (
          <Section id="tai-lieu" eyebrow={eyebrowOf("tai-lieu")} title="Tài liệu tham khảo">
            <ul className="ce-source-list">
                {figure.sources.map((s) => (
                  <li key={s}>
                    <a href={s} target="_blank" rel="noreferrer">
                      <Link2 /> {s}
                    </a>
                  </li>
                ))}
            </ul>
          </Section>
          )}

          {hasLessons && (
            <Section id="bai-hoc" eyebrow={eyebrowOf("bai-hoc")} title="Bài học liên quan">
              <div className="ce-insight-grid">
                {lessons.map((l) => (
                  <div key={l.id}>
                    <BookOpen />
                    <strong>{l.title}</strong>
                    <p>{l.estimatedReadMinutes} phút đọc</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <div className="ce-end-mark">
            <span>✦</span>
            <small>{period?.name?.toUpperCase() ?? "HISGO"}</small>
            <span>✦</span>
          </div>
        </article>

        <FigureInfobox figure={figure} relationTerms={relationTerms} />
      </div>
      <Footer />
    </div>
  );
}
