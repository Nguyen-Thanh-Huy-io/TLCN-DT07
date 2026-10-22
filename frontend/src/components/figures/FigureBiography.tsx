"use client";

import Link from "next/link";
import { BookOpen, Feather, Landmark, Link2, Users } from "lucide-react";
import { Heading } from "@/components/timeline/sk-ui";
import { PUBLIC_ROUTE_PREFIX } from "@/services/entities/landing.service";
import type { FigureView } from "./figure-utils";

export function FigureBiography({ figure: f }: { figure: FigureView }) {
  const roles = [f.occupation, ...f.titles].filter((v): v is string => Boolean(v));
  const biography = f.biography || f.description;
  return (
    <div className="sk-bio-view">
      <div className="sk-profile-section-heading">
        <div>
          <Heading level={3}>Phía sau những trang sử</Heading>
          <p>Tiểu sử, chức vụ và nguồn tư liệu tham khảo.</p>
        </div>
        <Feather size={21} />
      </div>
      <div className="sk-bio-bento">
        {biography && (
          <section className="sk-bio-tile sk-anecdotes">
            <BookOpen size={21} />
            <span className="sk-section-eyebrow">TIỂU SỬ</span>
            <Heading level={3}>Cuộc đời & sự nghiệp</Heading>
            <p>{biography}</p>
          </section>
        )}
        {roles.length > 0 && (
          <section className="sk-bio-tile sk-hometown">
            <Users size={21} />
            <span className="sk-section-eyebrow">VAI TRÒ</span>
            <Heading level={3}>Chức vụ & danh hiệu</Heading>
            {roles.map((r, i) => (
              <div className="sk-bio-work" key={r}>
                <span>0{i + 1}</span>
                <p>{r}</p>
              </div>
            ))}
          </section>
        )}
        {f.aliases.length > 0 && (
          <section className="sk-bio-tile">
            <Feather size={21} />
            <span className="sk-section-eyebrow">TÊN GỌI</span>
            <Heading level={3}>Tên gọi khác</Heading>
            <p>{f.aliases.join(" · ")}</p>
          </section>
        )}
        {f.subEraSlug && (
          <section className="sk-bio-tile">
            <Landmark size={21} />
            <span className="sk-section-eyebrow">THỜI ĐẠI</span>
            <Heading level={3}>Giai đoạn lịch sử</Heading>
            <p>
              <Link href={`${PUBLIC_ROUTE_PREFIX.PERIOD}/${f.subEraSlug}`}>{f.subEraTitle}</Link>
              {f.eraTitle && f.eraTitle !== f.subEraTitle && <> · {f.eraTitle}</>}
            </p>
          </section>
        )}
        {f.sources.length > 0 && (
          <section className="sk-bio-tile sk-anecdotes">
            <Link2 size={21} />
            <span className="sk-section-eyebrow">NGUỒN</span>
            <Heading level={3}>Tư liệu tham khảo</Heading>
            {f.sources.map((s) => (
              <p key={s}>
                <a href={s} target="_blank" rel="noreferrer">
                  {s}
                </a>
              </p>
            ))}
          </section>
        )}
      </div>
      <p className="sk-bio-source-note">
        Nội dung được tổng hợp từ các nguồn tham khảo; những điểm còn có ý kiến khác nhau cần đối chiếu thêm khi nghiên cứu.
      </p>
    </div>
  );
}
