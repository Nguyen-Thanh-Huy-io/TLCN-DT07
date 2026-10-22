"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Landmark,
  Link as LinkIcon,
  MapPin,
  Quote,
  UserRound,
} from "lucide-react";
import { MentionText } from "./EntityPopover";
import type { ArticleSection, EntityMention, EventReaderModel } from "./ce-types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function StickyToc({
  sections,
  activeId,
  progress,
  readMinutes,
}: {
  sections: ArticleSection[];
  activeId: string;
  progress: number;
  readMinutes: number;
}) {
  return (
    <aside className="ce-toc ce-sticky-card">
      <div className="ce-toc-title">
        <span>NỘI DUNG BÀI VIẾT</span>
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
      <div className="ce-toc-note">
        <BookOpen />
        <span>
          Ước tính thời gian đọc<strong>{readMinutes} phút</strong>
        </span>
      </div>
    </aside>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <motion.section
      id={id}
      className="ce-article-section"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15%" }}
    >
      <span className="ce-section-number">{eyebrow}</span>
      <h2>{title}</h2>
      {children}
    </motion.section>
  );
}

function ParticipantGrid({ participants }: { participants: EntityMention[] }) {
  return (
    <div className="ce-insight-grid">
      {participants.map((p) => (
        <Link key={p.id} href={p.href}>
          {p.type === "FIGURE" ? <UserRound /> : <Landmark />}
          <strong>{p.name}</strong>
          {p.roleLabel && <p>{p.roleLabel}</p>}
        </Link>
      ))}
    </div>
  );
}

function SourceList({ sources }: { sources: string[] }) {
  return (
    <ul className="ce-source-list">
      {sources.map((s) => (
        <li key={s}>
          {/^https?:\/\//.test(s) ? (
            <a href={s} target="_blank" rel="noreferrer">
              {decodeURI(s).replace(/^https?:\/\//, "")} <ExternalLink />
            </a>
          ) : (
            s
          )}
        </li>
      ))}
    </ul>
  );
}

function Article({ model }: { model: EventReaderModel }) {
  return (
    <article className="ce-article">
      {model.lead && (
        <p className="ce-lead">
          <MentionText text={model.lead} mentions={model.mentions} />
        </p>
      )}
      {model.sections.map((s, i) => (
        <Section key={s.id} id={s.id} eyebrow={String(i + 1).padStart(2, "0")} title={s.title}>
          {s.paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>
              <MentionText text={p} mentions={model.mentions} />
            </p>
          ))}
          {s.id === "dien-bien" && model.dateNote && (
            <div className="ce-context-quote">
              <Quote />
              <blockquote>{model.dateNote}</blockquote>
              <small>— Ghi chú niên đại</small>
            </div>
          )}
          {s.children && s.children.length > 0 && (
            <div className="ce-child-list">
              {s.children.map((c) => (
                <Link key={c.id} href={c.href}>
                  <span>{c.dateLabel}</span>
                  <strong>{c.title}</strong>
                  <ChevronRight />
                </Link>
              ))}
            </div>
          )}
          {s.participants && <ParticipantGrid participants={s.participants} />}
          {s.sources && <SourceList sources={s.sources} />}
        </Section>
      ))}
      {model.sections.length === 0 && !model.lead && (
        <p className="ce-empty">Nội dung chi tiết của sự kiện này đang được biên tập.</p>
      )}
      <div className="ce-end-mark">
        <span>✦</span>
        <small>{model.periodName?.toUpperCase() ?? "HISGO"}</small>
        <span>✦</span>
      </div>
    </article>
  );
}

function ContextSidebar({ model }: { model: EventReaderModel }) {
  const figures = model.mentions.filter((m) => m.type === "FIGURE");
  const locations = model.mentions.filter((m) => m.type === "LOCATION");
  return (
    <aside className="ce-context ce-sticky-card">
      <div className="ce-context-title">
        <span>HỒ SƠ NHANH</span>
        <LinkIcon />
      </div>
      <div className="ce-meta-row">
        <CalendarDays />
        <span>
          <small>THỜI GIAN</small>
          <strong>{model.dateLabel}</strong>
          {model.dateNote && <em>{model.dateNote}</em>}
        </span>
      </div>
      {model.locationLabel && (
        <div className="ce-meta-row">
          <MapPin />
          <span>
            <small>ĐỊA ĐIỂM</small>
            <strong>{model.locationLabel}</strong>
            {locations.length > 1 && <em>{locations.map((l) => l.name).join(" · ")}</em>}
          </span>
        </div>
      )}
      {figures.length > 0 && (
        <>
          <div className="ce-separator" />
          <small className="ce-mini-label">NHÂN VẬT CHÍNH</small>
          <div className="ce-figure-list">
            {figures.map((f) => (
              <Link key={f.id} href={f.href}>
                <span>{f.imageUrl ? <img src={f.imageUrl} alt="" /> : initials(f.name)}</span>
                <span>
                  <strong>{f.name}</strong>
                  {f.roleLabel && <small>{f.roleLabel}</small>}
                </span>
                <ChevronRight />
              </Link>
            ))}
          </div>
        </>
      )}
      {(model.periodHref || model.parent) && <div className="ce-separator" />}
      {model.periodHref && (
        <Link className="ce-context-link" href={model.periodHref}>
          <small>THUỘC GIAI ĐOẠN</small>
          <strong>{model.periodName}</strong>
          <ChevronRight />
        </Link>
      )}
      {model.parent && (
        <Link className="ce-context-link" href={model.parent.href}>
          <small>THUỘC SỰ KIỆN LỚN</small>
          <strong>{model.parent.title}</strong>
          <ChevronRight />
        </Link>
      )}
    </aside>
  );
}

export function EventReader({ model }: { model: EventReaderModel }) {
  const [activeId, setActiveId] = useState(model.sections[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const layoutRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });

  useEffect(() => {
    const nodes = model.sections
      .map((s) => document.getElementById(s.id))
      .filter((n): n is HTMLElement => n !== null);
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
  }, [model.sections]);

  return (
    <>
      <motion.div className="ce-reading-progress" style={{ scaleX }} />
      <div className="ce-reader-layout" ref={layoutRef}>
        <StickyToc sections={model.sections} activeId={activeId} progress={progress} readMinutes={model.readMinutes} />
        <Article model={model} />
        <ContextSidebar model={model} />
      </div>
    </>
  );
}
