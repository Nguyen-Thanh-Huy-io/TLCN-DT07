'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronsLeftRight } from 'lucide-react';

const KEY_STEP = 5;
const KEY_STEP_LARGE = 20;

/**
 * Thanh kéo đối chiếu Xưa – Nay: ảnh "xưa" phủ lên ảnh "nay", phần hiển thị cắt bằng
 * clip-path theo vị trí tay kéo. Hỗ trợ chuột, cảm ứng (Pointer Events) và bàn phím
 * (←/→, Shift để bước lớn, Home/End).
 */
export function BeforeAfterImageSlider({
  ancientImageUrl,
  ancientLabel,
  modernImageUrl,
  modernLabel,
  initial = 50,
}: {
  ancientImageUrl: string;
  ancientLabel: string;
  modernImageUrl: string;
  modernLabel: string;
  initial?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [pos, setPos] = useState(initial);

  const clamp = (v: number) => Math.min(100, Math.max(0, v));

  const moveTo = useCallback((clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPos(clamp(((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    moveTo(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current) moveTo(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    if (e.key === 'ArrowLeft') setPos((p) => clamp(p - step));
    else if (e.key === 'ArrowRight') setPos((p) => clamp(p + step));
    else if (e.key === 'Home') setPos(0);
    else if (e.key === 'End') setPos(100);
    else return;
    e.preventDefault();
  };

  return (
    <div className="space-y-2">
      <div
        ref={box}
        className="hx-compare aspect-[16/9] w-full cursor-ew-resize"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Lớp dưới: hiện nay */}
        <img src={modernImageUrl} alt={modernLabel} draggable={false} />
        {/* Lớp trên: xưa, cắt bên phải theo vị trí tay kéo */}
        <img
          src={ancientImageUrl}
          alt={ancientLabel}
          draggable={false}
          className="hx-ancient"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />

        <motion.span className="hx-compare-label left-3" animate={{ opacity: pos > 12 ? 1 : 0 }}>
          Xưa · {ancientLabel}
        </motion.span>
        <motion.span className="hx-compare-label right-3" animate={{ opacity: pos < 88 ? 1 : 0 }}>
          Nay · {modernLabel}
        </motion.span>

        <div className="hx-compare-handle" style={{ left: `${pos}%` }}>
          <div
            className="hx-compare-knob"
            role="slider"
            tabIndex={0}
            aria-label="Kéo để so sánh ảnh xưa và nay"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            aria-valuetext={`${Math.round(pos)}% ảnh xưa`}
            onKeyDown={onKeyDown}
          >
            <ChevronsLeftRight className="size-5" />
          </div>
        </div>
      </div>
      <p className="text-xs text-[var(--hx-muted)]">Kéo thanh trượt (hoặc dùng phím ← →) để đối chiếu diện mạo xưa và nay.</p>
    </div>
  );
}
