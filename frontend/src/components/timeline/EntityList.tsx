"use client";

import { MapPin, Users } from "lucide-react";
import { Heading, Badge } from "./sk-ui";
import type { TimeNode } from "./sk-types";

export function EntityList({ node, tab }: { node: TimeNode; tab: string }) {
  if (tab === "figures") {
    if (node.figures.length === 0) {
      return <p className="sk-muted">Chưa có dữ liệu nhân vật cho dấu mốc này.</p>;
    }
    return (
      <div className="sk-entity-list">
        {node.figures.map((f) => (
          <div className="sk-entity-card" key={f.id}>
            <div className="sk-entity-icon">
              {f.avatarUrl ? <img src={f.avatarUrl} alt={f.name} /> : <Users size={21} />}
            </div>
            <div>
              <Heading level={3}>{f.name}</Heading>
              <Badge>{f.role}</Badge>
              <p>{f.bio}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (node.locations.length === 0) {
    return <p className="sk-muted">Chưa có dữ liệu địa điểm cho dấu mốc này.</p>;
  }
  return (
    <div className="sk-entity-list">
      {node.locations.map((l) => (
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
