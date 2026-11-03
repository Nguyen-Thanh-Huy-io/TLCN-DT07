"use client";

import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { Heading, Badge } from "./sk-ui";
import { type TimelineFigure, type TimelineLocation, NodeContentTab } from "./sk-types";

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
              {f.avatarUrl ? <img src={f.avatarUrl} alt={f.name} /> : <Users size={21} />}
            </div>
            <div>
              <Heading level={3}>
                {f.slug ? <Link href={`/nhan-vat?nv=${encodeURIComponent(f.slug)}`}>{f.name}</Link> : f.name}
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
