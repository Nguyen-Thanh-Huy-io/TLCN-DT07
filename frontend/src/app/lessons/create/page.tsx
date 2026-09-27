"use client";
import { LessonEditor } from "@/components/FigmaUI";
import { useRouter } from "next/navigation";

export default function LessonForm() {
  const router = useRouter();
  const navigate = (p: string) => {
     if (p === "dashboard") router.push("/");
     else router.push(`/${p}`);
  };
  return <LessonEditor navigate={navigate} />;
}
