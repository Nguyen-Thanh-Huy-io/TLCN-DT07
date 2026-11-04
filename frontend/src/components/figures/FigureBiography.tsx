"use client";

import Link from "next/link";
import { BookOpen, Feather, Landmark, Link2, MapPin, Sparkles, Users } from "lucide-react";
import { Heading } from "@/components/timeline/sk-ui";
import { PUBLIC_ROUTE_PREFIX } from "@/services/entities/landing.service";
import type { FigureView } from "./figure-utils";

export function FigureBiography({ figure: f }: { figure: FigureView }) {
  const { legacy } = f;
  const roles = [f.occupation, ...f.titles].filter((v): v is string => Boolean(v));
  const biography = f.biography || f.description;
  return (
    <div className="sk-bio-view">
      <div className="sk-profile-section-heading">
        <div>
          <Heading level={3}>Phía sau những trang sử</Heading>
          <p>Quê hương, cuộc đời và những di sản còn ở lại.</p>
        </div>
        <Feather size={21} />
      </div>
      <div className="sk-bio-bento">
        {legacy.hometown && (
          <section className="sk-bio-tile sk-hometown">
            <MapPin size={21} />
            <span className="sk-section-eyebrow">NƠI KHỞI ĐẦU</span>
            <Heading level={3}>Quê hương</Heading>
            <p>{legacy.hometown}</p>
          </section>
        )}
        {legacy.backgroundAndYouth && (
          <section className="sk-bio-tile sk-youth">
            <Users size={21} />
            <span className="sk-section-eyebrow">NHỮNG NĂM THÁNG ĐẦU ĐỜI</span>
            <Heading level={3}>Xuất thân & thiếu thời</Heading>
            <p>{legacy.backgroundAndYouth}</p>
          </section>
        )}
        {biography && (
          <section className="sk-bio-tile sk-anecdotes">
            <BookOpen size={21} />
            <span className="sk-section-eyebrow">TIỂU SỬ</span>
            <Heading level={3}>Cuộc đời & sự nghiệp</Heading>
            <p>{biography}</p>
          </section>
        )}
        {legacy.notableWorks.length > 0 && (
          <section className="sk-bio-tile sk-works">
            <Feather size={21} />
            <span className="sk-section-eyebrow">TƯ TƯỞNG ĐỂ LẠI</span>
            <Heading level={3}>Tác phẩm & chiếu chỉ</Heading>
            {legacy.notableWorks.map((work, i) => (
              <div className="sk-bio-work" key={work}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <p>{work}</p>
              </div>
            ))}
          </section>
        )}
        {legacy.legacyAndHonors && (
          <section className="sk-bio-tile sk-legacy">
            <Landmark size={21} />
            <span className="sk-section-eyebrow">VỌNG MÃI NGÀN NĂM</span>
            <Heading level={3}>Di sản & tôn vinh</Heading>
            <p>{legacy.legacyAndHonors}</p>
          </section>
        )}
        {roles.length > 0 && (
          <section className="sk-bio-tile">
            <Users size={21} />
            <span className="sk-section-eyebrow">CHỨC VỤ</span>
            <Heading level={3}>Chức vụ & danh hiệu</Heading>
            <p>{roles.join(" · ")}</p>
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
        {legacy.anecdotes.length > 0 && (
          <section className="sk-bio-tile sk-anecdotes">
            <Sparkles size={21} />
            <span className="sk-section-eyebrow">BÊN LỀ CHÍNH SỬ</span>
            <Heading level={3}>Giai thoại được kể lại</Heading>
            {legacy.anecdotes.map((a) => (
              <p key={a}>{a}</p>
            ))}
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
