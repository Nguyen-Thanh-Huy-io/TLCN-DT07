"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Clock3, History, Network } from "lucide-react";
import { Badge, Button, Heading, Modal } from "@/components/timeline/sk-ui";
import type { PublicPeriodDto } from "@/services/entities/landing.service";
import { FigurePortrait } from "./FigurePortrait";
import { LifeTimeline } from "./LifeTimeline";
import { RelationshipGraph } from "./RelationshipGraph";
import { FigureBiography } from "./FigureBiography";
import type { FigureView } from "./figure-utils";

export type ProfileTab = "timeline" | "graph" | "bio";

const TABS: Array<{ id: ProfileTab; text: string; icon: typeof History }> = [
  { id: "timeline", text: "Dòng thời gian", icon: History },
  { id: "graph", text: "Mối quan hệ", icon: Network },
  { id: "bio", text: "Tiểu sử & nguồn", icon: BookOpen },
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
  const roles = f ? [f.occupation, ...f.titles].filter((v): v is string => Boolean(v)) : [];
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
                className={tab === t.id ? "sk-selected" : ""}
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
                {tab === "timeline" ? (
                  <LifeTimeline figure={f} periods={periods} />
                ) : tab === "graph" ? (
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
