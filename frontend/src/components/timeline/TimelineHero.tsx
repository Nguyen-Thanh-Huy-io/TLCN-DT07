import { BookOpen, Compass, Flag, MapPin } from "lucide-react";
import { heroLandscape } from "./sk-shared";

export function TimelineHero({ periodCount, eventCount }: { periodCount: number; eventCount: number }) {
  return (
    <section className="sk-hero">
      <img src={heroLandscape} alt="Núi non và dòng sông Ninh Bình" />
      <div className="sk-hero-shade" />
      <div className="sk-hero-content">
        <div className="sk-eyebrow">
          <span /> Mỗi dấu mốc, một câu chuyện
        </div>
        <h1>
          Chạm vào quá khứ.
          <br />
          <em>Hiểu hơn hiện tại.</em>
        </h1>
        <p>
          Khám phá dòng chảy lịch sử Việt Nam qua những sự kiện,
          <br className="sk-desktop-break" /> con người và vùng đất đã làm nên bản sắc dân tộc.
        </p>
        <div className="sk-hero-stats">
          <span>
            <BookOpen size={16} /> {periodCount} thời kỳ lịch sử
          </span>
          <i />
          <span>
            <Flag size={16} /> {eventCount} dấu mốc đáng nhớ
          </span>
          <i />
          <span>
            <Compass size={16} /> Vô vàn góc nhìn
          </span>
        </div>
      </div>
      <div className="sk-hero-location">
        <MapPin size={14} />
        <span>Tràng An, Ninh Bình</span>
        <span className="sk-photo-credit">Ảnh: Fernando Strabuli / Unsplash</span>
      </div>
      <span className="sk-hero-vertical">Hành trình xuyên thời gian</span>
    </section>
  );
}
