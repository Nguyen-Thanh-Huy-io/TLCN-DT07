"use client";
import {
  Badge,
  ContentCell,
  ManagementPage,
} from "@/components/FigmaUI";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TopicsPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = (p: string) => {
    if (p === "topic-form") router.push("/topics/create");
    else if (p === "dashboard") router.push("/");
    else router.push(`/${p}`);
  };

  useEffect(() => {
    api
      .get("/topics")
      .then((res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        setTopics(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to fetch topics:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const dataRows = topics.map((t) => {
    const statusMap: Record<string, string> = {
      DRAFT: "Draft",
      PENDING_REVIEW: "Review",
      PUBLISHED: "Published",
      REJECTED: "Rejected",
      ARCHIVED: "Archived",
    };

    const statusTone: Record<string, string> = {
      DRAFT: "gray",
      PENDING_REVIEW: "amber",
      PUBLISHED: "green",
      REJECTED: "red",
      ARCHIVED: "gray",
    };

    return [
      <ContentCell
        key={`topic-${t.id}`}
        icon="folder"
        title={t.name}
        sub={t.description || "Chưa có mô tả"}
      />,
      t.period?.name || "Chưa có giai đoạn",
      t.isSequential ? "Có" : "Không",
      String(t.displayOrder ?? 0).padStart(2, "0"),
      <Badge key={`status-${t.id}`} tone={statusTone[t.status] || "gray"}>
        {statusMap[t.status] || t.status}
      </Badge>,
      new Date(t.updatedAt).toLocaleDateString("vi-VN"),
    ];
  });

  if (loading) return <div style={{ padding: 20 }}>Đang tải dữ liệu...</div>;

  return <ManagementPage type="topics" navigate={navigate} dataRows={dataRows} />;
}
