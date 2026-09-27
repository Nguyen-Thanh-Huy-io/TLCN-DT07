"use client";
import { SimplePage } from "@/components/FigmaUI";
import { useRouter } from "next/navigation";

export default function TagsPage() {
  const router = useRouter();
  const navigate = (p: string) => {
    if (p === "dashboard") router.push("/");
    else router.push(`/${p}`);
  };

  return <SimplePage type="tags" navigate={navigate} />;
}
