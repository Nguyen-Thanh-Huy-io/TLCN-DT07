"use client";

import { usePublicTaxonomyTerms } from "@/features/taxonomy/usePublicTaxonomy";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Compass, Network } from "lucide-react";
import { Button, Heading } from "@/components/timeline/sk-ui";
import { FigurePortrait } from "./FigurePortrait";
import {
  RELATION_CATEGORY_LABELS,
  relationCategory,
  relationTargetLabel,
  type FigureView,
  type RelationCategory,
} from "./figure-utils";

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
  const relationTerms = usePublicTaxonomyTerms("ENTITY_RELATION");

  const relations = figure.relationships
    .map((relation) => ({
      relation,
      category: relationCategory(relation),
      label: relationTargetLabel(relation, relationTerms),
      target: directory.find((f) => f.id === relation.figureId),
    }))
    .filter((r): r is typeof r & { target: FigureView } => Boolean(r.target))
    .filter((r) => filter === "ALL" || r.category === filter);

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
        <Button className={filter === "ALL" ? "sk-selected" : ""} onClick={() => setFilter("ALL")}>
          Tất cả <span>{figure.relationships.length}</span>
        </Button>
        {categories.map((c) => (
          <Button
            className={`sk-relation-${c} ${filter === c ? "sk-selected" : ""}`}
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
                if (e.key === "Enter" || e.key === " ") {
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
