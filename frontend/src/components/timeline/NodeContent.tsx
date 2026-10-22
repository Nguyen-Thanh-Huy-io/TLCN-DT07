"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Layers, MapPin, Plus, Users, ArrowUpRight } from "lucide-react";
import { Button } from "./sk-ui";
import { EventCard } from "./EventCard";
import { EntityList } from "./EntityList";
import type { SubEra, TimeNode, TimelineEvent } from "./sk-types";

export function NodeContent({
  node,
  onDetail,
  onDrill,
  onSave,
  saved,
  workspace = false,
}: {
  node: TimeNode;
  onDetail: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onDrill: (s: SubEra) => void;
  onSave: (id: string) => void;
  saved: string[];
  workspace?: boolean;
}) {
  const [tab, setTab] = useState("events");
  const [more, setMore] = useState(false);

  const tabs = [
    { id: "events", label: "Sự kiện", icon: BookOpen, count: node.events.length },
    { id: "figures", label: "Nhân vật", icon: Users, count: node.figures.length },
    { id: "locations", label: "Địa điểm", icon: MapPin, count: node.locations.length },
  ];

  return (
    <div className={`sk-node-card-group ${workspace ? "sk-workspace-cards" : ""}`}>
      <div className="sk-entity-tabs" role="tablist">
        {tabs.map((t) => (
          <Button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "sk-selected" : ""}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={13} />
            {t.label}
            <span>{t.count}</span>
          </Button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {tab === "events" ? (
            <div className="sk-event-list">
              {node.events.slice(0, more ? undefined : 2).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onOpen={() => onDetail({ event, node })}
                  saved={saved.includes(event.id)}
                  onSave={() => onSave(event.id)}
                />
              ))}
              {node.events.length > 2 && (
                <Button className="sk-more-events" onClick={() => setMore(!more)}>
                  <Plus size={14} />
                  {more ? "Thu gọn sự kiện" : `Xem thêm ${node.events.length - 2} sự kiện cùng thời điểm`}
                </Button>
              )}
            </div>
          ) : (
            <EntityList figures={node.figures} locations={node.locations} tab={tab} />
          )}
        </motion.div>
      </AnimatePresence>
      {node.subPhases?.map((s) => (
        <Button className="sk-drill-button" key={s.id} onClick={() => onDrill(s)}>
          <Layers size={13} /> Xem giai đoạn chi tiết bên trong <ArrowUpRight size={14} />
        </Button>
      ))}
    </div>
  );
}
