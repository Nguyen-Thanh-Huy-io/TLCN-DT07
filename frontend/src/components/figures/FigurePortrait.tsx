"use client";

import { useId } from "react";
import { paletteFor, type FigureView } from "./figure-utils";

function traitsOf(figure: FigureView) {
  const text = [figure.occupation, figure.tagline, ...figure.titles].filter(Boolean).join(" ").toLowerCase();
  const warrior = /tướng|tư lệnh|chỉ huy|quân/.test(text);
  const monk = /thiền|nhà sư|hòa thượng/.test(text);
  const lifespan = figure.birthYear != null && figure.deathYear != null ? figure.deathYear - figure.birthYear : 0;
  return { warrior, monk, older: lifespan >= 65 };
}

/** Decorative illustration used when no real portrait exists — not a reconstruction of the person's appearance. */
export function FigurePortrait({ figure, compact = false }: { figure: FigureView; compact?: boolean }) {
  const uid = useId().replace(/:/g, "");

  if (figure.imageUrl) {
    return (
      <img
        src={figure.imageUrl}
        alt={`Chân dung ${figure.name}`}
        className={`sk-figure-portrait sk-figure-photo ${compact ? "sk-portrait-compact" : ""}`}
      />
    );
  }

  const { warrior, monk, older } = traitsOf(figure);
  return (
    <svg
      viewBox="0 0 300 260"
      role="img"
      aria-label={`Chân dung minh họa ${figure.name}`}
      className={`sk-figure-portrait sk-portrait-${paletteFor(figure.id)} ${compact ? "sk-portrait-compact" : ""}`}
    >
      <defs>
        <pattern id={`grain-${uid}`} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="2" r=".5" className="sk-portrait-grain" />
        </pattern>
        <linearGradient id={`robe-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop className="sk-robe-light" />
          <stop offset="1" className="sk-robe-dark" />
        </linearGradient>
      </defs>
      <path d="M0 0H300V260H0Z" className="sk-portrait-backdrop" />
      <circle cx="150" cy="129" r="93" className="sk-portrait-halo" />
      <circle cx="150" cy="129" r="82" className="sk-portrait-halo-line" />
      {!compact && (
        <>
          <path
            d="M17 24H53M17 24V60M283 24H247M283 24V60M17 236H53M17 236V200M283 236H247M283 236V200"
            className="sk-portrait-corners"
          />
          <path
            d="M36 153q12-50 32-48m-21 39q22-17 22-38M264 153q-12-50-32-48m21 39q-22-17-22-38"
            className="sk-portrait-leaves"
          />
          <text x="260" y="87" className="sk-portrait-seal" textAnchor="middle">HIS</text>
          <text x="260" y="100" className="sk-portrait-seal" textAnchor="middle">GO</text>
        </>
      )}
      <path d="M61 264Q67 209 107 195L131 184H169L193 195Q233 209 239 264Z" fill={`url(#robe-${uid})`} />
      <path d="M129 164V193L150 210L171 193V164" className="sk-portrait-skin-shadow" />
      <path d="M119 115Q118 78 150 78Q184 78 182 115L179 150Q174 179 151 186Q126 179 121 152Z" className="sk-portrait-skin" />
      <path d="M123 120Q116 112 115 125Q115 138 123 140M179 120Q187 112 186 125Q187 138 179 140" className="sk-portrait-skin" />
      <path d="M130 122q8-5 14-1M159 121q8-4 14 1" className="sk-portrait-brow" />
      <path d="M132 128l9 0M161 128l9 0" className="sk-portrait-eye" />
      <path d="M151 128l-3 20 8 1M140 160q11 4 22-1" className="sk-portrait-features" />
      {!monk && (
        <>
          <path d="M130 155q13-6 21 2q10-8 23-1l-11 8-12-2-13 2Z" className="sk-portrait-hair" />
          <path
            d={older ? "M131 167Q150 179 173 166Q169 201 151 224Q135 200 131 167Z" : "M139 174Q151 179 163 174L158 200H146Z"}
            className={older ? "sk-portrait-beard" : "sk-portrait-hair"}
          />
        </>
      )}
      {monk ? (
        <path d="M119 116Q114 78 149 76Q185 77 182 116Q178 85 150 85Q126 86 119 116Z" className="sk-portrait-skin-shadow" />
      ) : warrior ? (
        <>
          <path d="M115 116V86Q120 60 150 55Q180 60 186 86V116L173 101H127Z" className="sk-portrait-hair" />
          <path d="M112 102Q151 83 187 102L187 112Q150 96 113 114Z" className="sk-portrait-gold" />
          <path d="M146 58L151 35L157 58" className="sk-portrait-gold" />
          <path d="M150 61V88M121 88Q151 68 179 88" className="sk-portrait-armor-line" />
        </>
      ) : (
        <>
          <path d="M119 110L114 80H187L180 110Z" className="sk-portrait-hair" />
          <path d="M122 79V49Q151 36 179 49V79" className="sk-portrait-hair" />
          <path d="M80 79H221V88H80Z" className="sk-portrait-hair" />
          <path d="M126 62H174M126 70H174" className="sk-portrait-armor-line" />
          <circle cx="150" cy="58" r="4" className="sk-portrait-gold" />
        </>
      )}
      <path
        d={monk ? "M110 195L182 260M193 195L128 260" : "M110 195L150 225L190 195M150 225V260"}
        className="sk-portrait-collar"
      />
      {warrior && (
        <>
          <path d="M83 212L112 224L102 259M217 212L188 224L198 259" className="sk-portrait-armor-line" />
          <path d="M77 232L108 245M223 232L192 245" className="sk-portrait-armor-line" />
        </>
      )}
      {!monk && <circle cx="150" cy="236" r="6" className="sk-portrait-gold" />}
      <path d="M0 0H300V260H0Z" fill={`url(#grain-${uid})`} />
    </svg>
  );
}
