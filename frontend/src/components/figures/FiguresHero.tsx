import { Landmark, Network, Users } from "lucide-react";
import { Heading } from "@/components/timeline/sk-ui";
import { FigurePortrait } from "./FigurePortrait";
import type { FigureView } from "./figure-utils";

export function FiguresHero({
  figures,
  periodCount,
  relationCount,
}: {
  figures: FigureView[];
  periodCount: number;
  relationCount: number;
}) {
  const [front, back] = figures;
  return (
    <section className="sk-figures-hero">
      <div className="sk-figures-hero-copy">
        <div className="sk-figures-kicker">
          <span /> CON NGƯỜI LÀM NÊN LỊCH SỬ
        </div>
        <Heading level={1}>
          Những con người.
          <br />
          <em>Những dấu ấn bất diệt.</em>
        </Heading>
        <p>
          Gặp gỡ những nhân vật đã định hình dòng chảy lịch sử.
          <br />
          Từ một cuộc đời, mở ra cả một thời đại.
        </p>
        <div className="sk-figures-hero-stats">
          <span>
            <Users size={16} />
            <strong>{figures.length}</strong> nhân vật
          </span>
          <i />
          <span>
            <Landmark size={16} />
            <strong>{periodCount}</strong> giai đoạn lịch sử
          </span>
          <i />
          <span>
            <Network size={16} />
            <strong>{relationCount}</strong> mối quan hệ
          </span>
        </div>
      </div>
      {front && (
        <div className="sk-hero-portraits" aria-hidden="true">
          <div className="sk-hero-orbit sk-orbit-one" />
          <div className="sk-hero-orbit sk-orbit-two" />
          {back && (
            <div className="sk-hero-portrait-back">
              <FigurePortrait figure={back} />
            </div>
          )}
          <div className="sk-hero-portrait-front">
            <FigurePortrait figure={front} />
            <span>
              {front.name.toUpperCase()} <i>{front.lifespanLabel}</i>
            </span>
          </div>
          {!front.imageUrl && <span className="sk-illustration-disclaimer">CHÂN DUNG MINH HỌA</span>}
        </div>
      )}
    </section>
  );
}
