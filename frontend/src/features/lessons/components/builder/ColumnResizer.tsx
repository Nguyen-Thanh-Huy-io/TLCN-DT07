'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RowLayoutStrategy } from '../../strategies/row-layout.strategy';

interface ColumnResizerProps {
  leftWidthPercent: number;
  onResize: (newLeftPercent: number, newRightPercent: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ColumnResizer({
  leftWidthPercent,
  onResize,
  containerRef,
}: ColumnResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewRatio, setPreviewRatio] = useState<[number, number]>([
    leftWidthPercent,
    100 - leftWidthPercent,
  ]);
  const startXRef = useRef<number>(0);
  const startLeftPercentRef = useRef<number>(leftWidthPercent);

  useEffect(() => {
    setPreviewRatio([leftWidthPercent, 100 - leftWidthPercent]);
  }, [leftWidthPercent]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      if (containerWidth <= 0) return;

      const deltaX = e.clientX - startXRef.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const targetLeft = startLeftPercentRef.current + deltaPercent;

      const [snappedLeft, snappedRight] = RowLayoutStrategy.computeTwoColumnSnap(targetLeft);
      setPreviewRatio([snappedLeft, snappedRight]);
      onResize(snappedLeft, snappedRight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, containerRef, onResize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startLeftPercentRef.current = leftWidthPercent;
  };

  return (
    <div
      data-testid="column-resizer-handle"
      onMouseDown={handleMouseDown}
      title="Kéo sang trái/phải để điều chỉnh tỷ lệ cột (Snap 5%)"
      className={`relative w-2 mx-[-4px] z-20 flex items-center justify-center cursor-col-resize select-none group transition-all ${
        isDragging ? 'bg-blue-500 scale-x-125' : 'hover:bg-blue-400 bg-transparent'
      }`}
    >
      {/* Vạch kẻ mảnh ở giữa */}
      <div
        className={`w-0.5 h-full rounded transition-colors ${
          isDragging
            ? 'bg-blue-600'
            : 'bg-slate-200 group-hover:bg-blue-500'
        }`}
      />

      {/* Nút cầm kéo tay ↔ tròn nhỏ ở giữa */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border shadow-md flex items-center justify-center transition-all ${
          isDragging
            ? 'border-blue-600 text-blue-600 scale-110 shadow-blue-100 ring-2 ring-blue-200'
            : 'border-slate-300 text-slate-500 group-hover:border-blue-500 group-hover:text-blue-600'
        }`}
      >
        <span className="text-[10px] font-bold leading-none">↔</span>
      </div>

      {/* Tooltip hiển thị tỷ lệ trực tiếp khi đang kéo */}
      {isDragging && (
        <div className="absolute -top-7 px-2 py-0.5 bg-slate-900 text-white text-[11px] font-bold rounded shadow-lg whitespace-nowrap animate-in fade-in duration-100">
          {previewRatio[0]}% : {previewRatio[1]}%
        </div>
      )}
    </div>
  );
}
