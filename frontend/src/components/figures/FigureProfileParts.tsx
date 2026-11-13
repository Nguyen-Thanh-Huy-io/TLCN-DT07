'use client';

import Link from 'next/link';
import { BookOpen, Feather, Landmark, Link2, MapPin, Sparkles, Users, ArrowUpRight, Check, History, Shield, Compass, Network, Clock3, ExternalLink } from 'lucide-react';
import { Heading, Badge, Button, Modal } from '@/components/timeline/TimelineChrome';
import { PUBLIC_ROUTE_PREFIX, fetchFigureDirectory, fetchPeriods, type PublicPeriodDto } from '@/services/entities/landing.service';
import { periodTitle, RELATION_CATEGORY_LABELS, relationCategory, relationTargetLabel, buildFigureViews, type FigureView, type RelationCategory } from './figure-utils';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { eventCategoryLabel, useEventCategories } from '@/hooks/useEventCategories';
import { KeyboardKey, CommonFilterOption } from '@/constants/enums';
import { useState, createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { FigurePortrait } from './FiguresDirectoryParts';
import '@/components/timeline/sk-timeline.css';
import './sk-figures.css';

const SELECTED_CLASS = 'sk-selected';

// === FigureBiography.tsx ===
export function FigureBiography({ figure: f }: { figure: FigureView }) {
  const { legacy } = f;
  const roles = [f.occupation, ...f.titles].filter((v): v is string => Boolean(v));
  const biography = f.biography || f.description;
  return (
    <div className="sk-bio-view">
      <div className="sk-profile-section-heading">
        <div>
          <Heading level={3}>Phía sau những trang sử</Heading>
          <p>Quê hương, cuộc đời và những di sản còn ở lại.</p>
        </div>
        <Feather size={21} />
      </div>
      <div className="sk-bio-bento">
        {legacy.hometown && (
          <section className="sk-bio-tile sk-hometown">
            <MapPin size={21} />
            <span className="sk-section-eyebrow">NƠI KHỞI ĐẦU</span>
            <Heading level={3}>Quê hương</Heading>
            <p>{legacy.hometown}</p>
          </section>
        )}
        {legacy.backgroundAndYouth && (
          <section className="sk-bio-tile sk-youth">
            <Users size={21} />
            <span className="sk-section-eyebrow">NHỮNG NĂM THÁNG ĐẦU ĐỜI</span>
            <Heading level={3}>Xuất thân & thiếu thời</Heading>
            <p>{legacy.backgroundAndYouth}</p>
          </section>
        )}
        {biography && (
          <section className="sk-bio-tile sk-anecdotes">
            <BookOpen size={21} />
            <span className="sk-section-eyebrow">TIỂU SỬ</span>
            <Heading level={3}>Cuộc đời & sự nghiệp</Heading>
            <p>{biography}</p>
          </section>
        )}
        {legacy.notableWorks.length > 0 && (
          <section className="sk-bio-tile sk-works">
            <Feather size={21} />
            <span className="sk-section-eyebrow">TƯ TƯỞNG ĐỂ LẠI</span>
            <Heading level={3}>Tác phẩm & chiếu chỉ</Heading>
            {legacy.notableWorks.map((work, i) => (
              <div className="sk-bio-work" key={work}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <p>{work}</p>
              </div>
            ))}
          </section>
        )}
        {legacy.legacyAndHonors && (
          <section className="sk-bio-tile sk-legacy">
            <Landmark size={21} />
            <span className="sk-section-eyebrow">VỌNG MÃI NGÀN NĂM</span>
            <Heading level={3}>Di sản & tôn vinh</Heading>
            <p>{legacy.legacyAndHonors}</p>
          </section>
        )}
        {roles.length > 0 && (
          <section className="sk-bio-tile">
            <Users size={21} />
            <span className="sk-section-eyebrow">CHỨC VỤ</span>
            <Heading level={3}>Chức vụ & danh hiệu</Heading>
            <p>{roles.join(" · ")}</p>
          </section>
        )}
        {f.aliases.length > 0 && (
          <section className="sk-bio-tile">
            <Feather size={21} />
            <span className="sk-section-eyebrow">TÊN GỌI</span>
            <Heading level={3}>Tên gọi khác</Heading>
            <p>{f.aliases.join(" · ")}</p>
          </section>
        )}
        {f.subEraSlug && (
          <section className="sk-bio-tile">
            <Landmark size={21} />
            <span className="sk-section-eyebrow">THỜI ĐẠI</span>
            <Heading level={3}>Giai đoạn lịch sử</Heading>
            <p>
              <Link href={`${PUBLIC_ROUTE_PREFIX.PERIOD}/${f.subEraSlug}`}>{f.subEraTitle}</Link>
              {f.eraTitle && f.eraTitle !== f.subEraTitle && <> · {f.eraTitle}</>}
            </p>
          </section>
        )}
        {legacy.anecdotes.length > 0 && (
          <section className="sk-bio-tile sk-anecdotes">
            <Sparkles size={21} />
            <span className="sk-section-eyebrow">BÊN LỀ CHÍNH SỬ</span>
            <Heading level={3}>Giai thoại được kể lại</Heading>
            {legacy.anecdotes.map((a) => (
              <p key={a}>{a}</p>
            ))}
          </section>
        )}
        {f.sources.length > 0 && (
          <section className="sk-bio-tile sk-anecdotes">
            <Link2 size={21} />
            <span className="sk-section-eyebrow">NGUỒN</span>
            <Heading level={3}>Tư liệu tham khảo</Heading>
            {f.sources.map((s) => (
              <p key={s}>
                <a href={s} target="_blank" rel="noreferrer">
                  {s}
                </a>
              </p>
            ))}
          </section>
        )}
      </div>
      <p className="sk-bio-source-note">
        Nội dung được tổng hợp từ các nguồn tham khảo; những điểm còn có ý kiến khác nhau cần đối chiếu thêm khi nghiên cứu.
      </p>
    </div>
  );
}

// === LifeTimeline.tsx ===
function dateLabel(startYear: number, note: string | null) {
  if (note) return note;
  return startYear < 0 ? `${Math.abs(startYear)} TCN` : `Năm ${startYear}`;
}

export function LifeTimeline({ figure, periods }: { figure: FigureView; periods: PublicPeriodDto[] }) {
  const eventCategories = useEventCategories();
  return (
    <div className="sk-life-timeline">
      <div className="sk-profile-section-heading">
        <div>
          <Heading level={3}>Một cuộc đời, những dấu mốc</Heading>
          <p>Các sự kiện nhân vật tham gia, theo dữ liệu đã liên kết.</p>
        </div>
        <Badge>
          <Check size={12} /> {figure.events.length} sự kiện
        </Badge>
      </div>
      {figure.events.length ? (
        figure.events.map((e) => {
          const subEra = periodTitle(periods, e.periodSlug);
          const role = e.roleLabel || e.role;
          return (
            <motion.article
              key={e.id}
              className="sk-life-node"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="sk-life-node-point">
                <History size={13} />
              </div>
              <div className="sk-life-node-heading">
                <Heading level={3}>{dateLabel(e.startYear, e.eventDateNote)}</Heading>
                {subEra && <Badge>{subEra}</Badge>}
              </div>
              <div className="sk-life-node-role">
                <Shield size={12} />
                {role}
              </div>
              <div className="sk-life-events">
                <div className="sk-life-event">
                  <div>
                    <Badge>{eventCategoryLabel(eventCategories, e)}</Badge>
                    {e.isPrimary && (
                      <span>
                        <Sparkles size={11} /> VAI TRÒ CHÍNH
                      </span>
                    )}
                  </div>
                  <Heading level={3}>{e.title}</Heading>
                  {e.description && <p>{e.description}</p>}
                </div>
              </div>
              {e.slug && (
                <Link className="sk-button sk-open-main-timeline" href={`${PUBLIC_ROUTE_PREFIX.EVENT}/${e.slug}`}>
                  Xem chi tiết sự kiện <ArrowUpRight size={14} />
                </Link>
              )}
            </motion.article>
          );
        })
      ) : (
        <div className="sk-empty">
          <History size={28} />
          <Heading>Chưa có sự kiện được liên kết</Heading>
          <p>Hồ sơ sẽ cập nhật khi nhân vật được gắn vào sự kiện trong hệ thống.</p>
        </div>
      )}
    </div>
  );
}

// === RelationshipGraph.tsx ===
const CENTER = { x: 400, y: 245 };

export function RelationshipGraph({
  figure,
  directory,
  onNavigate,
}: {
  figure: FigureView;
  directory: FigureView[];
  onNavigate: (f: FigureView) => void;
}) {
  const [filter, setFilter] = useState<RelationCategory | "ALL">("ALL");
  const [hovered, setHovered] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const relations = figure.relationships
    .map((relation) => ({
      relation,
      category: relationCategory(relation),
      label: relationTargetLabel(relation),
      target: directory.find((f) => f.id === relation.figureId),
    }))
    .filter((r): r is typeof r & { target: FigureView } => Boolean(r.target))
    .filter((r) => filter === CommonFilterOption.ALL || r.category === filter);

  const categories = Object.keys(RELATION_CATEGORY_LABELS) as RelationCategory[];

  // An ellipse keeps every name inside the viewBox; nodes are spaced at equal angles from the top.
  const positions = relations.map((r, index) => {
    const angle =
      relations.length === 1 ? 0 : relations.length === 2 ? index * Math.PI : -Math.PI / 2 + (index * 2 * Math.PI) / relations.length;
    const x = CENTER.x + 267 * Math.cos(angle);
    const y = CENTER.y + 157 * Math.sin(angle);
    const dx = x - CENTER.x;
    const dy = y - CENTER.y;
    const distance = Math.hypot(dx, dy);
    const ux = dx / distance;
    const uy = dy / distance;
    return {
      ...r,
      x,
      y,
      x1: CENTER.x + ux * 59,
      y1: CENTER.y + uy * 59,
      x2: x - ux * 38,
      y2: y - uy * 38,
      labelX: CENTER.x + dx * 0.57,
      labelY: CENTER.y + dy * 0.57,
    };
  });

  if (figure.relationships.length === 0) {
    return (
      <div className="sk-relationship-view">
        <div className="sk-empty">
          <Network size={28} />
          <Heading>Chưa có mối quan hệ được ghi nhận</Heading>
          <p>Sơ đồ sẽ xuất hiện khi nhân vật được liên kết với nhân vật khác trong hệ thống.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sk-relationship-view">
      <div className="sk-profile-section-heading">
        <div>
          <Heading level={3}>Không ai viết lịch sử một mình.</Heading>
          <p>Chọn một nhân vật để tiếp tục khám phá mạng lưới.</p>
        </div>
        <Network size={21} />
      </div>
      <div className="sk-relationship-filters">
        <Button className={filter === CommonFilterOption.ALL ? SELECTED_CLASS : ""} onClick={() => setFilter("ALL")}>
          Tất cả <span>{figure.relationships.length}</span>
        </Button>
        {categories.map((c) => (
          <Button
            className={`sk-relation-${c} ${filter === c ? SELECTED_CLASS : ""}`}
            key={c}
            onClick={() => setFilter(c)}
          >
            <span className="sk-relation-key" />
            {RELATION_CATEGORY_LABELS[c]}
          </Button>
        ))}
      </div>
      <div className="sk-graph-scroll">
        <svg className="sk-relationship-graph" viewBox="0 0 800 500" role="group" aria-label={`Sơ đồ quan hệ của ${figure.name}`}>
          <defs>
            <pattern id="sk-graph-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r=".7" className="sk-graph-grid-dot" />
            </pattern>
            <clipPath id="sk-center-portrait-clip">
              <circle cx={CENTER.x} cy={CENTER.y} r="49" />
            </clipPath>
            {positions.map((p) => (
              <clipPath id={`sk-clip-${p.target.id}`} key={p.target.id}>
                <circle cx={p.x} cy={p.y} r="32" />
              </clipPath>
            ))}
          </defs>
          <path d="M0 0H800V500H0Z" fill="url(#sk-graph-grid)" />
          <ellipse cx={CENTER.x} cy={CENTER.y} rx="267" ry="157" className="sk-graph-orbit" />
          {positions.map((p) => (
            <g
              key={`link-${p.target.id}`}
              className={`sk-relation-${p.category} ${hovered && hovered !== p.target.id ? "sk-graph-dim" : ""}`}
            >
              <motion.line
                x1={p.x1}
                y1={p.y1}
                x2={p.x2}
                y2={p.y2}
                className="sk-relationship-line"
                initial={{ pathLength: reduceMotion ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7 }}
              />
              <rect x={p.labelX - 79} y={p.labelY - 12} width="158" height="24" rx="12" className="sk-graph-label-bg" />
              <text x={p.labelX} y={p.labelY + 4} textAnchor="middle" className="sk-graph-edge-label">
                {p.label}
              </text>
            </g>
          ))}
          <circle cx={CENTER.x} cy={CENTER.y} r="61" className="sk-graph-center-glow" />
          <circle cx={CENTER.x} cy={CENTER.y} r="54" className="sk-graph-center-ring" />
          <g clipPath="url(#sk-center-portrait-clip)">
            <svg x="343" y="192" width="114" height="110">
              <FigurePortrait figure={figure} compact />
            </svg>
          </g>
          <rect x="318" y="310" width="164" height="29" rx="14" className="sk-graph-center-name-bg" />
          <text x={CENTER.x} y="329" textAnchor="middle" className="sk-graph-center-name">
            {figure.name}
          </text>
          <text x={CENTER.x} y="356" textAnchor="middle" className="sk-graph-center-caption">
            NHÂN VẬT ĐANG KHÁM PHÁ
          </text>
          {positions.map((p) => (
            <motion.g
              key={p.target.id}
              role="button"
              tabIndex={0}
              aria-label={`Mở hồ sơ ${p.target.name}: ${p.label}`}
              className={`sk-graph-person sk-relation-${p.category}`}
              onClick={() => {
                setHovered(null);
                onNavigate(p.target);
              }}
              onKeyDown={(e) => {
                if (e.key === KeyboardKey.ENTER || e.key === " ") {
                  e.preventDefault();
                  setHovered(null);
                  onNavigate(p.target);
                }
              }}
              onMouseEnter={() => setHovered(p.target.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(p.target.id)}
              onBlur={() => setHovered(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <title>{`${p.target.name} — ${p.label}. Nhấn để mở hồ sơ.`}</title>
              <circle cx={p.x} cy={p.y} r="37" className="sk-graph-person-ring" />
              <g clipPath={`url(#sk-clip-${p.target.id})`}>
                <svg x={p.x - 38} y={p.y - 35} width="76" height="75">
                  <FigurePortrait figure={p.target} compact />
                </svg>
              </g>
              <text x={p.x} y={p.y + 56} textAnchor="middle" className="sk-graph-person-name">
                {p.target.name}
              </text>
              <text x={p.x} y={p.y + 73} textAnchor="middle" className="sk-graph-person-date">
                {p.target.lifespanLabel}
              </text>
            </motion.g>
          ))}
          {relations.length === 0 && (
            <text x={CENTER.x} y="420" textAnchor="middle" className="sk-graph-empty">
              Chưa có quan hệ thuộc nhóm này.
            </text>
          )}
        </svg>
      </div>
      <div className="sk-graph-footnote">
        <Compass size={14} />
        <p>Sơ đồ chỉ thể hiện các mối quan hệ đã được ghi nhận trong hệ thống, không phải toàn bộ quan hệ lịch sử.</p>
      </div>
      <div className="sk-relationship-accessible-list">
        {relations.map((r) => (
          <Button key={r.target.id} onClick={() => onNavigate(r.target)}>
            <span className={`sk-relation-${r.category}`}>
              <span className="sk-relation-key" />
              {r.target.name}
            </span>
            <small>
              {r.label}
              {r.relation.note && ` · ${r.relation.note}`}
            </small>
            <ArrowUpRight size={13} />
          </Button>
        ))}
      </div>
    </div>
  );
}

// === FigureProfileSheet.tsx ===
export enum FigureProfileTab {
  TIMELINE = "timeline",
  GRAPH = "graph",
  BIO = "bio",
}

export type ProfileTab = FigureProfileTab | "timeline" | "graph" | "bio";

const TABS: Array<{ id: FigureProfileTab; text: string; icon: typeof History }> = [
  { id: FigureProfileTab.TIMELINE, text: "Dòng thời gian", icon: History },
  { id: FigureProfileTab.GRAPH, text: "Mối quan hệ", icon: Network },
  { id: FigureProfileTab.BIO, text: "Tiểu sử & di sản", icon: BookOpen },
];

export function FigureProfileSheet({
  figure: f,
  directory,
  periods,
  tab,
  onTab,
  onClose,
  onNavigate,
}: {
  figure: FigureView | null;
  directory: FigureView[];
  periods: PublicPeriodDto[];
  tab: ProfileTab;
  onTab: (tab: ProfileTab) => void;
  onClose: () => void;
  onNavigate: (f: FigureView) => void;
}) {
  const roles = f?.roles ?? [];
  return (
    <Modal open={!!f} onClose={onClose} title="Hồ sơ nhân vật" className="sk-figure-profile">
      {f && (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={f.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sk-profile-header"
            >
              <div className="sk-profile-portrait">
                <FigurePortrait figure={f} compact />
              </div>
              <div className="sk-profile-overview">
                <span className="sk-section-eyebrow">MỘT CUỘC ĐỜI TRONG DÒNG LỊCH SỬ</span>
                <Heading level={1}>{f.name}</Heading>
                {f.aliases.length > 0 && <p className="sk-profile-alias">{f.aliases.join(" · ")}</p>}
                <span className="sk-profile-lifespan">
                  <Clock3 size={13} /> {f.lifespanLabel}
                </span>
                {roles.length > 0 && (
                  <div className="sk-figure-role-badges">
                    {roles.map((r) => (
                      <Badge key={r}>{r}</Badge>
                    ))}
                  </div>
                )}
                {(f.tagline || f.description) && <p className="sk-profile-short-bio">{f.tagline || f.description}</p>}
                {f.slug && (
                  <div className="sk-profile-actions">
                    <Link
                      href={`/nhan-vat/${f.slug}`}
                      className="sk-profile-detail-link"
                      title={`Xem toàn bộ trang chi tiết của ${f.name}`}
                    >
                      <span>Xem trang chi tiết đầy đủ</span>
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="sk-profile-tabs" role="tablist" aria-label="Nội dung hồ sơ">
            {TABS.map((t) => (
              <Button
                key={t.id}
                id={`sk-profile-tab-${t.id}`}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls="sk-profile-tabpanel"
                className={tab === t.id ? SELECTED_CLASS : ""}
                onClick={() => onTab(t.id)}
              >
                <t.icon size={15} />
                {t.text}
              </Button>
            ))}
          </div>
          <div
            className="sk-profile-tab-content"
            id="sk-profile-tabpanel"
            role="tabpanel"
            aria-labelledby={`sk-profile-tab-${tab}`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${f.id}-${tab}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {tab === FigureProfileTab.TIMELINE ? (
                  <LifeTimeline figure={f} periods={periods} />
                ) : tab === FigureProfileTab.GRAPH ? (
                  <RelationshipGraph figure={f} directory={directory} onNavigate={onNavigate} />
                ) : (
                  <FigureBiography figure={f} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </Modal>
  );
}

// === FigureProfileProvider.tsx ===
// Style cho FigureProfileSheet/FigurePortrait (chân dung, badge vai trò...) — trước đây chỉ
// trang /nhan-vat tự import nên mở modal từ nơi khác (Dòng thời gian, /su-kien/[slug]) bị
// thiếu CSS, chân dung render ra khối đen. Import ở đây để có bất cứ đâu Provider được mount.

interface FigureProfileContextValue {
  /** Mở hồ sơ nhân vật dạng modal tại chỗ, không rời khỏi trang hiện tại. */
  openFigure: (slug: string) => void;
}

const FigureProfileContext = createContext<FigureProfileContextValue | null>(null);

/** Trả về null nếu không có <FigureProfileProvider> bao ngoài — nơi gọi nên tự rơi về điều hướng thường (<Link>). */
export function useFigureProfile(): FigureProfileContextValue | null {
  return useContext(FigureProfileContext);
}

/**
 * Cho phép mở hồ sơ nhân vật (modal "Hồ sơ nhân vật" — 3 tab Dòng thời gian/Mối quan hệ/
 * Tiểu sử & di sản, giống trang /nhan-vat) ngay tại trang đang xem (Dòng thời gian, chi
 * tiết sự kiện...) thay vì điều hướng hẳn sang /nhan-vat?nv=<slug> rồi mới mở modal ở đó
 * — tránh giật trang/mất vị trí cuộn khi bấm vào 1 nhân vật.
 */
export function FigureProfileProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<{ figures: FigureView[]; periods: PublicPeriodDto[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [tab, setTab] = useState<ProfileTab>(FigureProfileTab.TIMELINE);

  const ensureData = useCallback(() => {
    if (data || loading) return;
    setLoading(true);
    Promise.all([fetchFigureDirectory(), fetchPeriods()])
      .then(([figuresRaw, periods]) => setData({ figures: buildFigureViews(figuresRaw, periods), periods }))
      .finally(() => setLoading(false));
  }, [data, loading]);

  const openFigure = useCallback(
    (slug: string) => {
      setTab(FigureProfileTab.TIMELINE);
      setPendingSlug(slug);
      ensureData();
    },
    [ensureData],
  );

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (data && pendingSlug) {
        setSelectedSlug(pendingSlug);
        setPendingSlug(null);
      }
    });
  }, [data, pendingSlug]);

  const selected = data?.figures.find((f) => f.slug === selectedSlug) ?? null;
  const value = useMemo(() => ({ openFigure }), [openFigure]);

  return (
    <FigureProfileContext.Provider value={value}>
      {children}
      <FigureProfileSheet
        figure={selected}
        directory={data?.figures ?? []}
        periods={data?.periods ?? []}
        tab={tab}
        onTab={setTab}
        onClose={() => {
          setSelectedSlug(null);
          setPendingSlug(null);
        }}
        onNavigate={(f) => setSelectedSlug(f.slug)}
      />
    </FigureProfileContext.Provider>
  );
}
