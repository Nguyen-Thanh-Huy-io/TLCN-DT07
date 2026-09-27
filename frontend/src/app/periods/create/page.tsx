"use client";
import { FormPage } from "@/components/FigmaUI";
import { useRouter } from "next/navigation";

export default function PeriodForm() {
  const router = useRouter();
  const navigate = (p: string) => {
     if (p === "dashboard") router.push("/");
     else router.push(`/${p}`);
  };
  return <FormPage kind="period" navigate={navigate} />;
}
