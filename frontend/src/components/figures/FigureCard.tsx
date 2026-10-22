"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Clock3, History, Landmark, Quote } from "lucide-react";
import { Badge, Button, Heading } from "@/components/timeline/sk-ui";
import { FIGURE_ROLE_LABELS } from "@/constants/enums";
import { FigurePortrait } from "./FigurePortrait";
import { FIGURE_ROLE_ICONS, figureRoles } from "./figure-roles";
import type { FigureView } from "./figure-utils";

export function FigureCard({ figure: f, onOpen }: { figure: FigureView; onOpen: () => void }) {
  const roles = figureRoles(f.roles);
  return (
    <article className="sk-directory-figure-card">
      <Button className="sk-figure-artwork" onClick={onOpen} aria-label={`Mở hồ sơ ${f.name}`}>
        <FigurePortrait figure={f} />
        {f.subEraTitle && <span className="sk-figure-artwork-era">{f.subEraTitle}</span>}
        <span className="sk-figure-open-icon">
          <ArrowUpRight size={17} />
        </span>
        {!f.imageUrl && <span className="sk-figure-artwork-caption">CHÂN DUNG MINH HỌA</span>}
      </Button>
      <div className="sk-figure-card-body">
        <div className="sk-figure-lifespan">
          <Clock3 size={11} /> {f.lifespanLabel}
          <span>{f.events.length} sự kiện</span>
        </div>
        <Button className="sk-figure-name" onClick={onOpen}>
          <Heading level={3}>{f.name}</Heading>
          <ArrowUpRight size={16} />
        </Button>
        <div className="sk-figure-alias">{f.aliases[0]}</div>
        {roles.length > 0 && (
          <div className="sk-figure-role-badges">
            {roles.map((r) => {
              const Icon = FIGURE_ROLE_ICONS[r];
              return (
                <Badge className={`sk-role-${r}`} key={r}>
                  <Icon size={10} />
                  {FIGURE_ROLE_LABELS[r]}
                </Badge>
              );
            })}
          </div>
        )}
        <p className="sk-figure-short-bio">{f.tagline || f.description}</p>
        {f.legacy.famousQuote ? (
          <div className="sk-figure-quote">
            <Quote size={12} />
            <p>{f.legacy.famousQuote}</p>
          </div>
        ) : f.eraTitle && (
          <div className="sk-figure-dynasties">
            <Badge>
              <Landmark size={10} />
              {f.eraTitle}
            </Badge>
          </div>
        )}
        <div className="sk-figure-card-bottom">
          <span>
            <History size={12} />
            {f.relationships.length} mối quan hệ
          </span>
          <Button onClick={onOpen}>
            Xem hồ sơ <ArrowRight size={13} />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function FiguresGrid({ figures, onOpen }: { figures: FigureView[]; onOpen: (f: FigureView) => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div layout className="sk-figures-grid">
      <AnimatePresence mode="popLayout">
        {figures.map((figure, index) => (
          <motion.div
            layout
            key={figure.id}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
            transition={{ duration: 0.25, delay: Math.min(index, 12) * 0.025 }}
          >
            <FigureCard figure={figure} onOpen={() => onOpen(figure)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
