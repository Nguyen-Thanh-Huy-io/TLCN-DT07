"use client";

import { useState } from "react";
import { Header as SiteHeader } from "@/components/hisgo/Header";

const ArrowIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M3 10h13M11 5l5 5-5 5" />
  </svg>
);

const LeafMark = ({ light = false }: { light?: boolean }) => (
  <span
    className={`landing-page-shell__leaf${light ? " landing-page-shell__leaf--light" : ""}`}
    aria-hidden="true"
  >
    <i />
    <i />
    <i />
    <i />
    <i />
  </span>
);

const SectionTitle = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="landing-page-shell__section-heading">
    <div className="landing-page-shell__section-heading-line">
      <span />
      <i>◆</i>
      <h2>{title}</h2>
      <i>◆</i>
      <span />
    </div>
    <p>{subtitle}</p>
  </div>
);

const CTA = ({
  children,
  secondary = false,
}: {
  children: React.ReactNode;
  secondary?: boolean;
}) => (
  <button
    className={`landing-page-shell__cta${secondary ? " landing-page-shell__cta--secondary" : ""}`}
    type="button"
  >
    <span>{children}</span>
    <ArrowIcon />
  </button>
);

export function Hero() {
  return (
    <section className="landing-page-shell__hero landing-page-shell__shell" id="top">
      <div className="landing-page-shell__ambient landing-page-shell__ambient--hero-red" aria-hidden="true" />
      <div className="landing-page-shell__ambient landing-page-shell__ambient--hero-cream" aria-hidden="true" />
      <div className="landing-page-shell__hero-copy">
        <p className="landing-page-shell__eyebrow">Hành trình khai dòng chảy Việt tộc</p>
        <h1>
          Mỗi dấu mốc,
          <br />
          một câu chuyện Việt Nam
        </h1>
        <p className="landing-page-shell__hero-intro">
          Khám phá lịch sử Việt Nam qua những dòng thời gian sống động, những
          câu chuyện ý nghĩa và những nhân vật Việt Nam.
        </p>
        <div className="landing-page-shell__hero-actions">
          <CTA>Bắt đầu khám phá</CTA>
          <CTA secondary>Xem kích thước</CTA>
        </div>
      </div>
      <div className="landing-page-shell__hero-visual">
        <img
          src="/assets/hero.jpg"
          alt="Ngôi chùa Việt Nam bên mặt hồ lúc hoàng hôn"
        />
        <div className="landing-page-shell__hero-shade" />
        <button className="landing-page-shell__play" type="button" aria-label="Phát video giới thiệu">
          <span />
        </button>
        <p className="landing-page-shell__hero-caption">
          <span className="landing-page-shell__tiny-play">▶</span> Nhịp phách cuộc viễn
        </p>
      </div>
    </section>
  );
}

const eras = [
  ["Trống đồng", "Văn Lang – Âu Lạc", "thế kỷ VII TCN – 179 TCN"],
  ["Thành cổ", "Thời Bắc thuộc", "179 TCN – 939"],
  ["Kinh thành", "Nhà Lý – Nhà Trần", "1009 – 1400"],
  ["Nghĩa quân", "Khởi nghĩa Lam Sơn", "1418 – 1427"],
  ["Hoàng thành", "Triều Nguyễn", "1802 – 1945"],
  ["Cờ Việt Nam", "Việt Nam hiện đại", "1945 – nay"],
];

export function Timeline() {
  return (
    <section className="landing-page-shell__timeline landing-page-shell__shell" id="timeline">
      <div className="landing-page-shell__ambient landing-page-shell__ambient--timeline-red" aria-hidden="true" />
      <SectionTitle
        title="Dòng chảy lịch sử Việt Nam"
        subtitle="Từ buổi đầu dựng nước đến thời đại hiện nay"
      />
      <div className="landing-page-shell__timeline-track">
        {eras.map(([alt, name, date], index) => (
          <article className="landing-page-shell__era" key={name}>
            <div className={`landing-page-shell__era-image landing-page-shell__era-image--${index + 1}`}>
              <img
                src={index % 2 === 0 ? "/assets/temple.jpg" : "/assets/citadel.jpg"}
                alt={alt}
              />
            </div>
            <h3>{name}</h3>
            <p>({date})</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FeaturedStory() {
  return (
    <section className="landing-page-shell__shell landing-page-shell__story-section">
      <SectionTitle
        title="Những chương sử đáng nhớ"
        subtitle="Những con người kiệt xuất đã đặt nền móng lên lịch sử Việt Nam"
      />
      <article className="landing-page-shell__story">
        <img
          src="/assets/mountain.jpg"
          alt="Núi non hùng vĩ trong ánh hoàng hôn"
        />
        <div className="landing-page-shell__story-overlay" />
        <div className="landing-page-shell__story-content">
          <p className="landing-page-shell__eyebrow landing-page-shell__eyebrow--light">Hành trình gian khó</p>
          <h2>
            Khởi nghĩa Lam Sơn (1418 - 1427)
            <br />
            Dựng lại giang sơn
          </h2>
          <p>
            Câu chuyện về lòng yêu nước, ý chí quật cường và khát vọng độc lập
            dân tộc. Cuộc kháng chiến chống quân Minh đầy gian khổ dưới sự lãnh
            đạo của Lê Lợi.
          </p>
          <CTA>Khám phá câu chuyện</CTA>
        </div>
        <button
          className="landing-page-shell__round-arrow landing-page-shell__round-arrow--left"
          type="button"
          aria-label="Câu chuyện trước"
        >
          ‹
        </button>
        <button
          className="landing-page-shell__round-arrow landing-page-shell__round-arrow--right"
          type="button"
          aria-label="Câu chuyện sau"
        >
          ›
        </button>
        <div className="landing-page-shell__story-dots" aria-hidden="true">
          <i />
          <i className="active" />
          <i />
          <i />
          <i />
          <i />
        </div>
        <p className="landing-page-shell__story-counter">
          Tự động chuyển 16s sau&nbsp;&nbsp; 1/6&nbsp;&nbsp; ◷
        </p>
      </article>
    </section>
  );
}

const figures = [
  ["Hùng Vương", "Vị vua lập nước của các dân tộc Việt"],
  ["Lý Thái Tổ", "Kiến tạo nhà Lý (974 - 1028)"],
  ["Trần Hưng Đạo", "Anh hùng dân tộc (1228 - 1300)"],
  ["Lê Lợi", "Người anh hùng (1385 - 1433)"],
  ["Nguyễn Huệ", "Vị tướng kiệt xuất (1753 - 1792)"],
  ["Hồ Chí Minh", "Danh nhân thế giới (1890 - 1969)"],
];

export function Characters() {
  return (
    <section className="landing-page-shell__shell landing-page-shell__characters" id="characters">
      <SectionTitle
        title="Nhân vật lịch sử tiêu biểu"
        subtitle="Những con người kiệt xuất làm nên nền lịch sử Việt Nam"
      />
      <div className="landing-page-shell__characters-grid">
        {figures.map(([name, description], index) => (
          <article className="landing-page-shell__character-card" key={name}>
            <img
              src={`/assets/portrait-${index + 1}.jpg`}
              alt={`Chân dung ${name}`}
            />
            <div>
              <h3>{name}</h3>
              <p>{description}</p>
            </div>
            <span aria-hidden="true">◎</span>
          </article>
        ))}
      </div>
    </section>
  );
}

const stages = [
  {
    tab: "Bắc thuộc lần II",
    period: "Năm 43 – 543",
    text: "Thời kỳ đất nước ta rơi vào ách đô hộ của nhà Hán, bắt đầu từ năm 43 đến năm 544. Dù chịu nhiều áp bức, nhân dân Việt Nam vẫn kiên cường bảo tồn bản sắc, nuôi dưỡng ý chí độc lập và chuẩn bị cho những cuộc khởi nghĩa lần sau này.",
    image: "/assets/citadel.jpg",
  },
  {
    tab: "Nhà Lý & Nhà Triều",
    period: "Năm 1009 – 1400",
    text: "Thăng Long trở thành trái tim của quốc gia Đại Việt. Văn hóa, giáo dục và nghệ thuật kiến trúc bước vào thời kỳ phát triển rực rỡ, để lại dấu ấn trường tồn.",
    image: "/assets/temple.jpg",
  },
  {
    tab: "Bắc thuộc lần III",
    period: "Năm 1407 – 1427",
    text: "Hai thập kỷ thử thách hun đúc tinh thần quật khởi của dân tộc, mở đường cho cuộc khởi nghĩa Lam Sơn và kỷ nguyên độc lập mới.",
    image: "/assets/mountain.jpg",
  },
  {
    tab: "Thời kỳ xây nền tự chủ",
    period: "Năm 905 – 1009",
    text: "Những nền móng đầu tiên của quốc gia tự chủ được gây dựng, khẳng định ý chí tự quyết và mở ra một chương mới trong lịch sử dân tộc.",
    image: "/assets/hero.jpg",
  },
];

function ExplorePeriod() {
  const [active, setActive] = useState(0);
  const stage = stages[active];

  return (
    <section className="landing-page-shell__shell landing-page-shell__explore" id="explore">
      <SectionTitle
        title="Khám phá giai đoạn"
        subtitle="Lựa chọn giai đoạn lịch sử bạn quan tâm để bắt đầu hành trình khám phá"
      />
      <div className="landing-page-shell__tabs" role="tablist" aria-label="Các giai đoạn lịch sử">
        {stages.map((item, index) => (
          <button
            className={active === index ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={active === index}
            onClick={() => setActive(index)}
            key={item.tab}
          >
            {item.tab}
          </button>
        ))}
      </div>
      <article className="landing-page-shell__period-card">
        <div className="landing-page-shell__period-card-copy">
          <p className="landing-page-shell__eyebrow">Giai đoạn nổi bật</p>
          <h2>
            {stage.tab}
            <small>({stage.period})</small>
          </h2>
          <p>{stage.text}</p>
          <CTA>Khám phá chi tiết</CTA>
        </div>
        <div className="landing-page-shell__period-card-image">
          <img
            src={stage.image}
            alt={`Phong cảnh gợi nhớ giai đoạn ${stage.tab}`}
          />
          <p>Đất nước trong vòng ách đô hộ</p>
          <span>
            {active + 1} / {stages.length}&nbsp;&nbsp; ◯ ◯
          </span>
        </div>
      </article>
    </section>
  );
}

const knowledge = [
  ["⌂", "Văn hóa & Đời sống"],
  ["♜", "Kinh tế & Di tích"],
  ["⚑", "Chính trị & Ngoại giao"],
  ["◫", "Kinh tế & Xã hội"],
  ["♧", "Tư tưởng & Tôn giáo"],
  ["⌘", "Bản đồ & Địa danh"],
];

function Knowledge() {
  return (
    <section className="landing-page-shell__shell landing-page-shell__knowledge">
      <SectionTitle
        title="Kiến thức lịch sử"
        subtitle="Cùng tìm hiểu lịch sử qua các chủ đề đặc sắc"
      />
      <div className="landing-page-shell__knowledge-grid">
        {knowledge.map(([icon, label]) => (
          <button type="button" key={label}>
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        ))}
      </div>
      <div className="landing-page-shell__newsletter">
        <div>
          <p>Cùng HISGO</p>
          <h2>Lan tỏa giá trị lịch sử Việt Nam</h2>
          <small>
            Đồng hành cùng bạn khám phá, hiểu và yêu hơn lịch sử dân tộc.
          </small>
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="email">
            Nhập email của bạn
          </label>
          <input id="email" type="email" placeholder="Nhập email của bạn" />
          <button type="submit">Đăng ký</button>
        </form>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="landing-page-shell__footer" id="footer">
      <div className="landing-page-shell__shell landing-page-shell__footer-grid">
        <div>
          <a className="landing-page-shell__brand" href="#top">
            <LeafMark />
            <strong>HISGO</strong>
          </a>
          <p>Khám phá lịch sử · Hiểu về hiện tại · Kiến tạo tương lai</p>
        </div>
        <p>
          Hệ thống dữ liệu riêng, biên tập bởi đội ngũ chuyên gia.
          <br />
          Đồng hành cùng học sinh, sinh viên, người yêu lịch sử.
        </p>
        <p>
          Hỗ trợ · Đặt câu hỏi
          <br />
          Hướng dẫn sử dụng
          <br />
          Liên hệ
        </p>
        <div className="landing-page-shell__footer-social">
          <p>Kết nối với chúng tôi</p>
          <span>f</span>
          <span>▶</span>
          <span>♪</span>
        </div>
      </div>
      <div className="landing-page-shell__shell landing-page-shell__footer-bottom">
        <span>© 2025 HISGO. All rights reserved.</span>
        <span>Điều khoản sử dụng&nbsp;&nbsp;&nbsp; Chính sách bảo mật</span>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="landing-page-shell">
      <div className="landing-page-shell__content-panel">
        <SiteHeader activeSectionId="explore" />
        <main>
          <Hero />
          <Timeline />
          <FeaturedStory />
          <Characters />
          <ExplorePeriod />
          <Knowledge />
        </main>
        <Footer />
      </div>
    </div>
  );
}
