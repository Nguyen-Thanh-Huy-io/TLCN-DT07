import { HeritageExplorer } from "@/features/heritage/components/HeritageExplorer";
import { mockHeritages } from "@/features/heritage/heritage.mock";

export const metadata = {
  title: "Di tích, kiến trúc & hiện vật — HISGO",
  description: "Khám phá di tích lịch sử qua hình ảnh kiến trúc, đối chiếu xưa – nay, biên niên sử xây dựng và hiện vật.",
};

export default function HeritagePage() {
  return <HeritageExplorer heritages={mockHeritages} isSample />;
}
