"use client";
import { Dashboard } from "@/components/FigmaUI";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const navigate = (p: string) => {
    if (p === "dashboard") router.push("/");
    else if (p === "period-form") router.push("/periods/create");
    else if (p === "topic-form") router.push("/topics/create");
    else if (p === "lesson-editor") router.push("/lessons/create");
    else router.push(`/${p}`);
  };
  return <Dashboard navigate={navigate} />;
}
