'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Compass, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Badge, Button, Heading, shortTitle } from './TimelineChrome';
import { NodeContent } from './TimelineNodes';
import { formatTimelinePeriod } from './timeline-date-formatter';
import { RemoteImage } from '@/components/common/CommonUi';
import { KeyboardKey } from '@/constants/enums';
import { SK_SELECTED_CLASS, type SubEra, type TimeNode, type TimelineEvent } from './sk-adapter';

const RULER_PIN_WIDTH_PX = 220;
const RULER_PIN_GAP_PX = 22;
const RULER_ITEM_STRIDE_PX = RULER_PIN_WIDTH_PX + RULER_PIN_GAP_PX;
const RULER_VIRTUAL_THRESHOLD = 40;
const RULER_OVERSCAN_COUNT = 8;
const RULER_VIEWPORT_COUNT = 10;

function computeRulerWindow(totalCount: number, scrollLeft: number) {
  if (totalCount <= RULER_VIRTUAL_THRESHOLD) {
    return { start: 0, end: totalCount, padLeft: 0, padRight: 0 };
  }
  const anchorIndex = Math.max(0, Math.floor(scrollLeft / RULER_ITEM_STRIDE_PX));
  const start = Math.max(0, anchorIndex - RULER_OVERSCAN_COUNT);
  const end = Math.min(totalCount, anchorIndex + RULER_VIEWPORT_COUNT + RULER_OVERSCAN_COUNT);
  return {
    start,
    end,
    padLeft: start * RULER_ITEM_STRIDE_PX,
    padRight: Math.max(0, (totalCount - end) * RULER_ITEM_STRIDE_PX),
  };
}

interface HorizontalTimelineRulerProps {
  visibleNodes: TimeNode[];
  selectedNode: TimeNode | undefined;
  onSelectNode: (id: string) => void;
  subs: SubEra[];
  onDetail: (d: { event: TimelineEvent; node: TimeNode }) => void;
  onSave: (id: string) => void;
  saved: string[];
}

export function HorizontalTimelineRuler({
  visibleNodes,
  selectedNode,
  onSelectNode,
  subs,
  onDetail,
  onSave,
  saved,
}: HorizontalTimelineRulerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Gom các mốc theo giai đoạn để tạo nhịp phân chia thời gian
  const groups = useMemo(() => {
    const visible = new Set(visibleNodes.map((n) => n.id));
    return subs
      .map((s) => ({ sub: s, nodes: s.timeNodes.filter((n) => visible.has(n.id)) }))
      .filter((g) => g.nodes.length > 0);
  }, [subs, visibleNodes]);

  const ordered = useMemo(() => groups.flatMap((g) => g.nodes), [groups]);
  const index = selectedNode ? ordered.findIndex((n) => n.id === selectedNode.id) : -1;
  const selectedSub = groups.find((g) => g.nodes.some((n) => n.id === selectedNode?.id))?.sub;
  const rulerWindow = useMemo(
    () => computeRulerWindow(ordered.length, scrollLeft),
    [ordered.length, scrollLeft],
  );
  const renderedNodes = useMemo(
    () => ordered.slice(rulerWindow.start, rulerWindow.end),
    [ordered, rulerWindow.end, rulerWindow.start],
  );

  const step = useCallback(
    (delta: number) => {
      const nextIndex = Math.min(ordered.length - 1, Math.max(0, index + delta));
      const next = ordered[nextIndex];
      if (!next) return;
      if (ordered.length > RULER_VIRTUAL_THRESHOLD) {
        const clientWidth = trackRef.current?.clientWidth ?? 0;
        setScrollLeft(
          Math.max(0, nextIndex * RULER_ITEM_STRIDE_PX - Math.max(0, clientWidth - RULER_PIN_WIDTH_PX) / 2),
        );
      }
      onSelectNode(next.id);
    },
    [index, ordered, onSelectNode],
  );

  // Tự động căn giữa mốc đang chọn trên thước đo (hỗ trợ cả chế độ cửa sổ ảo hóa > 40 mốc)
  useEffect(() => {
    if (!selectedNode || isDragging || index < 0) return;
    const track = trackRef.current;
    if (!track) return;
    if (ordered.length > RULER_VIRTUAL_THRESHOLD) {
      const targetLeft = Math.max(
        0,
        index * RULER_ITEM_STRIDE_PX - Math.max(0, track.clientWidth - RULER_PIN_WIDTH_PX) / 2,
      );
      if (typeof track.scrollTo === 'function') {
        track.scrollTo({ left: targetLeft, behavior: 'smooth' });
      } else {
        track.scrollLeft = targetLeft;
      }
      return;
    }
    const target = track.querySelector<HTMLElement>(`[data-node-id="${selectedNode.id}"]`);
    if (typeof target?.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [index, isDragging, ordered.length, selectedNode]);

  // Hỗ trợ kéo chuột tự do trên thước đo (Drag to scroll)
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    setIsDragging(true);
    setDragStartX(e.pageX - trackRef.current.offsetLeft);
    setDragStartScrollLeft(trackRef.current.scrollLeft);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - dragStartX) * 1.5;
    trackRef.current.scrollLeft = dragStartScrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <section className="sk-museum-ruler-container" aria-label="Thước đo dòng thời gian lịch sử">
      {/* 1. Header Toolbar: Tiêu đề, số mốc và nút điều hướng Trước/Sau */}
      <div className="sk-ruler-header">
        <div className="sk-ruler-header-info">
          <span className="sk-ruler-compass-icon" aria-hidden="true">
            <Compass size={18} />
          </span>
          <div className="sk-ruler-header-titles">
            <span className="sk-ruler-sub-badge">
              {selectedSub ? selectedSub.title : 'Dòng lịch sử Việt Nam'}
            </span>
            <span className="sk-ruler-node-counter">
              Mốc {Math.max(1, index + 1)} / {ordered.length}
            </span>
          </div>
        </div>

        <div className="sk-ruler-header-actions">
          <Button
            className="sk-ruler-nav-btn"
            aria-label="Mốc trước trên thước"
            disabled={index <= 0}
            onClick={() => step(-1)}
          >
            <ChevronLeft size={18} />
            <span>Trước</span>
          </Button>
          <Button
            className="sk-ruler-nav-btn"
            aria-label="Mốc tiếp theo trên thước"
            disabled={index < 0 || index >= ordered.length - 1}
            onClick={() => step(1)}
          >
            <span>Sau</span>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* 2. Museum Digital Ruler: Thước đo với các thẻ mốc có ảnh lazy-loading, xếp thẳng 1 hàng ngang duy nhất */}
      <div
        className={`sk-museum-ruler-track ${isDragging ? 'sk-is-dragging' : ''}`}
        ref={trackRef}
        role="listbox"
        aria-label="Thước đo các mốc lịch sử"
        tabIndex={0}
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onKeyDown={(e) => {
          if (e.key === KeyboardKey.ARROW_RIGHT) {
            e.preventDefault();
            step(1);
          } else if (e.key === KeyboardKey.ARROW_LEFT) {
            e.preventDefault();
            step(-1);
          }
        }}
      >
        <div className="sk-ruler-content">
          {/* Dải các thẻ mốc nằm ngay ngắn trên 1 hàng ngang (ảo hóa cửa sổ khi > 40 mốc) */}
          <div
            className="sk-ruler-markers-strip"
            style={
              rulerWindow.padLeft > 0 || rulerWindow.padRight > 0
                ? { paddingLeft: rulerWindow.padLeft, paddingRight: rulerWindow.padRight }
                : undefined
            }
          >
            {renderedNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const firstEvent = node.events[0];
              const eventCount = node.events.length;
              const formattedDate = formatTimelinePeriod(node.dateLabel);

              return (
                <button
                  type="button"
                  key={node.id}
                  role="option"
                  aria-selected={isSelected}
                  data-node-id={node.id}
                  className={`sk-ruler-marker-pin ${isSelected ? SK_SELECTED_CLASS : ''}`}
                  onClick={() => onSelectNode(node.id)}
                  title={`${formattedDate} - ${firstEvent?.title ?? ''}`}
                >
                  {/* Thẻ mốc có Thumbnail hình ảnh */}
                  <div className="sk-ruler-marker-card">
                    {firstEvent?.imageUrl ? (
                      <div className="sk-ruler-marker-thumb">
                        <RemoteImage
                          src={firstEvent.imageUrl}
                          alt={firstEvent.title}
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="sk-ruler-marker-thumb-placeholder">
                        <Sparkles size={18} />
                      </div>
                    )}

                    <div className="sk-ruler-marker-body">
                      <span className="sk-ruler-marker-date">{formattedDate}</span>
                      <strong className="sk-ruler-marker-title">
                        {firstEvent?.title ?? node.dateLabel}
                      </strong>
                      {eventCount > 1 && (
                        <span className="sk-ruler-marker-extra">+{eventCount - 1} sự kiện</span>
                      )}
                    </div>
                  </div>

                  {/* Chân cắm & hạt định vị mốc trên trục */}
                  <div className="sk-ruler-pin-stem" aria-hidden="true">
                    <div className="sk-ruler-pin-line" />
                    <div className="sk-ruler-pin-bead" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Trục thước vàng đồng phía dưới */}
          <div className="sk-ruler-spine-bar" aria-hidden="true">
            <div className="sk-ruler-ticks" />
          </div>
        </div>
      </div>

      {/* 4. Workspace: Khung thông tin chi tiết đầy đủ của mốc được chọn */}
      <AnimatePresence mode="wait">
        {selectedNode && (
          <motion.div
            key={selectedNode.id}
            className="sk-horizontal-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <div className="sk-panel-title">
              <div>
                <Badge>{selectedSub ? shortTitle(selectedSub.title) : 'Không gian khám phá'}</Badge>
                <Heading>{formatTimelinePeriod(selectedNode.dateLabel)}</Heading>
              </div>
              <div className="sk-panel-nav">
                <span>
                  Mốc {index + 1} / {ordered.length}
                </span>
                <Button aria-label="Mốc trước" disabled={index <= 0} onClick={() => step(-1)}>
                  <ChevronLeft size={16} /> Trước
                </Button>
                <Button
                  aria-label="Mốc tiếp theo"
                  disabled={index >= ordered.length - 1}
                  onClick={() => step(1)}
                >
                  Sau <ChevronRight size={16} />
                </Button>
              </div>
            </div>
            <NodeContent
              node={selectedNode}
              onDetail={onDetail}
              onSave={onSave}
              saved={saved}
              workspace
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
