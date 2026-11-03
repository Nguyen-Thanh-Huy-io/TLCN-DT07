"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchFigureDirectory,
  fetchPeriods,
  type PublicPeriodDto,
} from "@/services/entities/landing.service";
import { FigureProfileSheet, FigureProfileTab, type ProfileTab } from "./FigureProfileSheet";
import { buildFigureViews, type FigureView } from "./figure-utils";

interface FigureProfileContextValue {
  /** Mở hồ sơ nhân vật dạng modal tại chỗ, không rời khỏi trang hiện tại. */
  openFigure: (slug: string) => void;
}

const FigureProfileContext = createContext<FigureProfileContextValue | null>(null);

/** Trả về null nếu không có <FigureProfileProvider> bao ngoài — nơi gọi nên tự rơi về điều hướng thường (<Link>). */
export function useFigureProfile(): FigureProfileContextValue | null {
  return useContext(FigureProfileContext);
}

/**
 * Cho phép mở hồ sơ nhân vật (modal "Hồ sơ nhân vật" — 3 tab Dòng thời gian/Mối quan hệ/
 * Tiểu sử & di sản, giống trang /nhan-vat) ngay tại trang đang xem (Dòng thời gian, chi
 * tiết sự kiện...) thay vì điều hướng hẳn sang /nhan-vat?nv=<slug> rồi mới mở modal ở đó
 * — tránh giật trang/mất vị trí cuộn khi bấm vào 1 nhân vật.
 */
export function FigureProfileProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<{ figures: FigureView[]; periods: PublicPeriodDto[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [tab, setTab] = useState<ProfileTab>(FigureProfileTab.TIMELINE);

  const ensureData = useCallback(() => {
    if (data || loading) return;
    setLoading(true);
    Promise.all([fetchFigureDirectory(), fetchPeriods()])
      .then(([figuresRaw, periods]) => setData({ figures: buildFigureViews(figuresRaw, periods), periods }))
      .finally(() => setLoading(false));
  }, [data, loading]);

  const openFigure = useCallback(
    (slug: string) => {
      setTab(FigureProfileTab.TIMELINE);
      setPendingSlug(slug);
      ensureData();
    },
    [ensureData],
  );

  useEffect(() => {
    if (data && pendingSlug) {
      setSelectedSlug(pendingSlug);
      setPendingSlug(null);
    }
  }, [data, pendingSlug]);

  const selected = data?.figures.find((f) => f.slug === selectedSlug) ?? null;
  const value = useMemo(() => ({ openFigure }), [openFigure]);

  return (
    <FigureProfileContext.Provider value={value}>
      {children}
      <FigureProfileSheet
        figure={selected}
        directory={data?.figures ?? []}
        periods={data?.periods ?? []}
        tab={tab}
        onTab={setTab}
        onClose={() => {
          setSelectedSlug(null);
          setPendingSlug(null);
        }}
        onNavigate={(f) => setSelectedSlug(f.slug)}
      />
    </FigureProfileContext.Provider>
  );
}
