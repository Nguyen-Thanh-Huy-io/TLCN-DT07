"use client";
import { ManagementPage, ContentCell, Badge } from "@/components/FigmaUI";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/services/api";

export default function PeriodsPage() {
  const router = useRouter();
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = (p: string) => {
     if (p === "period-form") router.push("/periods/create");
     else if (p === "dashboard") router.push("/");
     else router.push(`/${p}`);
  };

  useEffect(() => {
    api.get("/periods")
      .then((res) => {
        // Assume res.data is an array or res.data.data
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setPeriods(data);
      })
      .catch((err) => {
        console.error("Failed to fetch periods:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Đang tải dữ liệu...</div>;

  // Format data to match FigmaUI data format
  // "GIAI ĐOẠN", "KHU VỰC", "THỜI GIAN", "THỨ TỰ", "TRẠNG THÁI", "CẬP NHẬT",
  const dataRows = periods.map(p => [
    <ContentCell
      key={`cell-${p.id}`}
      icon="clock"
      title={p.name}
      sub={p.description || "Chưa có mô tả"}
    />,
    "Việt Nam",
    `${p.startYear} – ${p.endYear}`,
    p.orderIndex?.toString().padStart(2, "0") || "00",
    <Badge key={`badge-${p.id}`} tone={p.isActive ? "green" : "gray"}>
      {p.isActive ? "Active" : "Inactive"}
    </Badge>,
    new Date(p.updatedAt).toLocaleDateString("vi-VN"),
  ]);

  return <ManagementPage type="periods" navigate={navigate} dataRows={dataRows} />;
}
