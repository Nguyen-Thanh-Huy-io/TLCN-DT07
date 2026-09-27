"use client";
import {
  Badge,
  ContentCell,
  ManagementPage,
} from "@/components/FigmaUI";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LessonsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = (p: string) => {
    if (p === "lesson-editor") router.push("/lessons/create");
    else if (p === "dashboard") router.push("/");
    else router.push(`/${p}`);
  };

  useEffect(() => {
    api
      .get("/lessons")
      .then((res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        setLessons(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to fetch lessons:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const dataRows = lessons.map((lesson) => {
    const difficultyMap: Record<string, { label: string; tone: string }> = {
      EASY: { label: "Easy", tone: "green" },
      MEDIUM: { label: "Medium", tone: "blue" },
      HARD: { label: "Hard", tone: "red" },
    };

    const statusMap: Record<string, { label: string; tone: string }> = {
      DRAFT: { label: "Draft", tone: "gray" },
      PENDING_REVIEW: { label: "Pending", tone: "amber" },
      PUBLISHED: { label: "Published", tone: "green" },
      REJECTED: { label: "Rejected", tone: "red" },
      ARCHIVED: { label: "Archived", tone: "gray" },
    };

    const difficultyInfo = difficultyMap[lesson.difficulty] || { label: "Medium", tone: "blue" };
    const statusInfo = statusMap[lesson.status] || { label: lesson.status || "Draft", tone: "gray" };

    return [
      <ContentCell
        key={`lesson-${lesson.id}`}
        icon="book"
        title={lesson.title}
        sub={lesson.updatedAt ? new Date(lesson.updatedAt).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
      />,
      lesson.topic?.name || "Chưa có chủ đề",
      <Badge key={`diff-${lesson.id}`} tone={difficultyInfo.tone}>
        {difficultyInfo.label}
      </Badge>,
      String(lesson.xpReward ?? 0),
      `${lesson.estimatedReadMinutes ?? 0} phút`,
      <Badge key={`status-${lesson.id}`} tone={statusInfo.tone}>
        {statusInfo.label}
      </Badge>,
      lesson.creator?.username || "N/A",
    ];
  });

  if (loading) return <div style={{ padding: 20 }}>Đang tải dữ liệu...</div>;

  return <ManagementPage type="lessons" navigate={navigate} dataRows={dataRows} />;
}
