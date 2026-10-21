"use client";

import { useState } from "react";
import Link from "next/link";

const ArrowIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M3 10h13M11 5l5 5-5 5" />
  </svg>
);

export interface ExploreStage {
  id: string;
  tab: string;
  period: string;
  text: string;
  image: string;
  href: string;
}

export function ExplorePeriodTabs({ stages }: { stages: ExploreStage[] }) {
  const [active, setActive] = useState(0);
  if (stages.length === 0) return null;
  const stage = stages[active];

  return (
    <>
      <div className="landing-page-shell__tabs" role="tablist" aria-label="Các giai đoạn lịch sử">
        {stages.map((item, index) => (
          <button
            className={active === index ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={active === index}
            onClick={() => setActive(index)}
            key={item.id}
          >
            {item.tab}
          </button>
        ))}
      </div>
      <article className="landing-page-shell__period-card">
        <div className="landing-page-shell__period-card-copy">
          <p className="landing-page-shell__eyebrow">Giai đoạn nổi bật</p>
          <h2>
            {stage.tab}
            {stage.period && <small>({stage.period})</small>}
          </h2>
          <p>{stage.text}</p>
          <Link className="landing-page-shell__cta" href={stage.href}>
            <span>Khám phá chi tiết</span>
            <ArrowIcon />
          </Link>
        </div>
        <div className="landing-page-shell__period-card-image">
          <img src={stage.image} alt={`Hình minh hoạ cho ${stage.tab}`} />
          <span>
            {active + 1} / {stages.length}&nbsp;&nbsp; ◯ ◯
          </span>
        </div>
      </article>
    </>
  );
}
