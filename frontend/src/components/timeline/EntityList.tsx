"use client";

import Link from "next/link";
import { ArrowUpRight, MapPin, Users } from "lucide-react";
import { Heading, Badge } from "./SkUi";
import { type TimelineFigure, type TimelineLocation, NodeContentTab } from "./sk-types";
import { useFigureProfile } from "@/components/figures/FigureProfileProvider";
import { RemoteImage } from "@/components/common/RemoteImage";

/** Mở hồ sơ nhân vật tại chỗ (modal) nếu có Provider bao ngoài; không thì mới điều hướng sang /nhan-vat?nv=. */
function FigureLink({ slug, name }: { slug: string; name: string }) {
  const figureProfile = useFigureProfile();
  const href = `/nhan-vat?nv=${encodeURIComponent(slug)}`;
  const content = (
    <>
      {name} <ArrowUpRight size={14} className="sk-entity-link-icon" />
    </>
  );
  if (!figureProfile) return <Link href={href}>{content}</Link>;
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        figureProfile.openFigure(slug);
      }}
    >
      {content}
    </a>
  );
}

type WithEvents<T> = T & { eventTitles?: string[] };

function EventTitles({ titles }: { titles?: string[] }) {
  if (!titles || titles.length === 0) return null;
  return <small className="sk-entity-events">Trong sự kiện: {titles.join("; ")}</small>;
}

export function EntityList({
  figures,
  locations,
  tab,
  showEventTitles = false,
}: {
  figures: WithEvents<TimelineFigure>[];
  locations: WithEvents<TimelineLocation>[];
  tab: NodeContentTab | string;
  showEventTitles?: boolean;
}) {
  if (tab === NodeContentTab.FIGURES) {
    if (figures.length === 0) {
      return <p className="sk-muted">Chưa có nhân vật nào được liên kết.</p>;
    }
    return (
      <div className="sk-entity-list">
        {figures.map((f) => (
          <div className="sk-entity-card" key={f.id}>
            <div className="sk-entity-icon">
              {f.avatarUrl ? <RemoteImage src={f.avatarUrl} alt={f.name} /> : <Users size={21} />}
            </div>
            <div>
              <Heading level={3}>
                {f.slug ? <FigureLink slug={f.slug} name={f.name} /> : f.name}
              </Heading>
              <Badge>{f.role}</Badge>
              {showEventTitles && <EventTitles titles={f.eventTitles} />}
              <p>{f.bio}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (locations.length === 0) {
    return <p className="sk-muted">Chưa có địa điểm nào được liên kết.</p>;
  }
  return (
    <div className="sk-entity-list">
      {locations.map((l) => (
        <div className="sk-entity-card" key={l.id}>
          <div className="sk-entity-icon">
            <MapPin size={21} />
          </div>
          <div>
            <Heading level={3}>{l.name}</Heading>
            <small>
              {l.modernName}
              {l.coordinates && ` · ${l.coordinates}`}
            </small>
            {showEventTitles && <EventTitles titles={l.eventTitles} />}
            <p>{l.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
