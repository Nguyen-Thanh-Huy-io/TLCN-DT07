import React from "react";
import Link from "next/link";
import { TopicItem } from "@/data/topics";
import {
  Landmark,
  Castle,
  Swords,
  Scale,
  BookOpen,
  MapPin,
  LucideIcon,
} from "lucide-react";

interface TopicTileProps {
  topic: TopicItem;
}

const iconMap: Record<TopicItem["icon"], LucideIcon> = {
  Landmark,
  Castle,
  Swords,
  Scale,
  BookOpen,
  MapPin,
};

export function TopicTile({ topic }: TopicTileProps) {
  const IconComponent = iconMap[topic.icon];

  return (
    <Link
      href={topic.href}
      className="group flex flex-col items-center justify-start bg-[var(--bg-surface)]/50 border border-[var(--border)] rounded-[10px] px-2.5 sm:px-3 py-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-gold)] hover:shadow-[var(--shadow-card)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] w-full"
    >
      {/* Icon 32px stroke 1.3 màu --gold, hover phóng nhẹ */}
      <div className="text-[var(--gold)] flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.08] flex-shrink-0 h-8">
        {IconComponent && <IconComponent size={32} strokeWidth={1.3} />}
      </div>

      {/* Tên chủ đề: 13-14px weight 400, màu --text-body, min-height 2 dòng, canh trên */}
      <div className="min-h-[40px] flex items-start justify-center mt-3 w-full">
        <h3 className="text-[13px] sm:text-[14px] font-normal font-[family-name:var(--font-body)] text-[var(--text-body)] group-hover:text-[var(--primary)] transition-colors leading-snug line-clamp-2 px-1 text-balance">
          {topic.title}
        </h3>
      </div>
    </Link>
  );
}
