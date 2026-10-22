"use client";

import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { Heading, Badge } from "./sk-ui";
import type { TimelineFigure, TimelineLocation } from "./sk-types";

export function EntityList({
  figures,
  locations,
  tab,
}: {
  figures: TimelineFigure[];
  locations: TimelineLocation[];
  tab: string;
}) {
  if (tab === "figures") {
    if (figures.length === 0) {
      return <p className="sk-muted">Chưa có dữ liệu nhân vật cho sự kiện này.</p>;
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
              <p>{f.bio}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (locations.length === 0) {
    return <p className="sk-muted">Chưa có dữ liệu địa điểm cho sự kiện này.</p>;
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
            <p>{l.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
