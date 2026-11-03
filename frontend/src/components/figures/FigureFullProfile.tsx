"use client";

import { useRouter } from "next/navigation";
import { Clock3 } from "lucide-react";
import { Badge, Heading } from "@/components/timeline/sk-ui";
import type { PublicPeriodDto } from "@/services/entities/landing.service";
import { FigurePortrait } from "./FigurePortrait";
import { LifeTimeline } from "./LifeTimeline";
import { LifeTimelineHero } from "./LifeTimelineHero";
import { RelationshipGraph } from "./RelationshipGraph";
import { FigureBiography } from "./FigureBiography";
import { figureRoles, useFigureRoles } from "./figure-roles";
import type { FigureView } from "./figure-utils";
import "./sk-figures.css";

/**
 * Trang chi tiết nhân vật (/nhan-vat/[slug]): dựng lại cùng nội dung với modal "Hồ sơ
 * nhân vật" (FigureProfileSheet) nhưng ở dạng đọc tổng thể — mọi mục (dòng thời gian, mối
 * quan hệ, tiểu sử & di sản) xếp liên tục trên 1 trang, không chia tab ẩn bớt nội dung.
 */
export function FigureFullProfile({
  figure,
  directory,
  periods,
}: {
  figure: FigureView;
  directory: FigureView[];
  periods: PublicPeriodDto[];
}) {
  const router = useRouter();
  const { label: roleLabel } = useFigureRoles();
  const roles = figureRoles(figure.roles).map(roleLabel);

  return (
    <div className="sk-figure-profile sk-figure-full-profile">
      <div className="sk-profile-header">
        <div className="sk-profile-portrait">
          <FigurePortrait figure={figure} />
        </div>
        <div className="sk-profile-overview">
          <span className="sk-section-eyebrow">MỘT CUỘC ĐỜI TRONG DÒNG LỊCH SỬ</span>
          <Heading level={1}>{figure.name}</Heading>
          {figure.aliases.length > 0 && <p className="sk-profile-alias">{figure.aliases.join(" · ")}</p>}
          <span className="sk-profile-lifespan">
            <Clock3 size={13} /> {figure.lifespanLabel}
          </span>
          {roles.length > 0 && (
            <div className="sk-figure-role-badges">
              {roles.map((r) => (
                <Badge key={r}>{r}</Badge>
              ))}
            </div>
          )}
          {(figure.tagline || figure.description) && (
            <p className="sk-profile-short-bio">{figure.tagline || figure.description}</p>
          )}
        </div>
      </div>

      <div className="sk-profile-full-body">
        <LifeTimelineHero events={figure.events} />
        <LifeTimeline figure={figure} periods={periods} />
        <RelationshipGraph figure={figure} directory={directory} onNavigate={(f) => router.push(`/nhan-vat/${f.slug}`)} />
        <FigureBiography figure={figure} />
      </div>
    </div>
  );
}
