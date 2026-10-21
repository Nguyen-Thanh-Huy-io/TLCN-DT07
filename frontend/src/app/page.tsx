import Link from "next/link";
import { Header as SiteHeader } from "@/components/hisgo/Header";
import { ExplorePeriodTabs, type ExploreStage } from "@/components/hisgo/ExplorePeriodTabs";
import { NewsletterSignup } from "@/components/hisgo/NewsletterSignup";
import { fetchLandingContent } from "@/services/entities/landing.service";
import type { EraItem } from "@/data/eras";
import type { FigureItem } from "@/data/figures";
import type { TopicItem } from "@/data/topics";

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
  href,
}: {
  children: React.ReactNode;
  secondary?: boolean;
  href?: string;
}) => {
  const className = `landing-page-shell__cta${secondary ? " landing-page-shell__cta--secondary" : ""}`;
  if (href) {
    return (
      <Link href={href} className={className}>
        <span>{children}</span>
        <ArrowIcon />
      </Link>
    );
  }
  return (
    <button className={className} type="button">
      <span>{children}</span>
      <ArrowIcon />
    </button>
  );
};

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
          <CTA href="/chuong-trinh-hoc">Bắt đầu học lịch sử</CTA>
          <CTA secondary href="/dong-thoi-gian">Khám phá dòng thời gian</CTA>
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

export function Timeline({ eras }: { eras: EraItem[] }) {
  if (eras.length === 0) return null;
  return (
    <section className="landing-page-shell__timeline landing-page-shell__shell" id="timeline">
      <div className="landing-page-shell__ambient landing-page-shell__ambient--timeline-red" aria-hidden="true" />
      <SectionTitle
        title="Dòng chảy lịch sử Việt Nam"
        subtitle="Từ buổi đầu dựng nước đến thời đại hiện nay"
      />
      <div className="landing-page-shell__timeline-track">
        {eras.map((era, index) => (
          <Link href={era.href} className="landing-page-shell__era" key={era.id}>
            <div className={`landing-page-shell__era-image landing-page-shell__era-image--${index + 1}`}>
              <img
                src={era.image}
                alt={era.alt}
              />
            </div>
            <h3>{era.title}</h3>
            <p>{era.period}</p>
          </Link>
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
          <CTA href="/chuong-trinh-hoc">Khám phá chương trình học</CTA>
        </div>
        <div className="landing-page-shell__story-dots" aria-hidden="true">
          <i />
          <i className="active" />
          <i />
          <i />
          <i />
          <i />
        </div>
      </article>
    </section>
  );
}

export function Characters({ figures }: { figures: FigureItem[] }) {
  if (figures.length === 0) return null;
  return (
    <section className="landing-page-shell__shell landing-page-shell__characters" id="characters">
      <SectionTitle
        title="Nhân vật lịch sử tiêu biểu"
        subtitle="Những con người kiệt xuất làm nên nền lịch sử Việt Nam"
      />
      <div className="landing-page-shell__characters-grid">
        {figures.map((figure) => (
          <Link href={figure.href} className="landing-page-shell__character-card" key={figure.id}>
            <img
              src={figure.image}
              alt={figure.alt}
            />
            <div>
              <h3>{figure.name}</h3>
              <p>{figure.tagline}</p>
            </div>
            <span aria-hidden="true">◎</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Knowledge({ topics }: { topics: TopicItem[] }) {
  return (
    <section className="landing-page-shell__shell landing-page-shell__knowledge">
      <SectionTitle
        title="Kiến thức lịch sử"
        subtitle="Cùng tìm hiểu lịch sử qua các chủ đề đặc sắc"
      />
      <div className="landing-page-shell__knowledge-grid">
        {topics.map((topic) => (
          <Link href={topic.href} key={topic.id} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d7c5a1] bg-[#fffdf8] px-4 py-3 text-sm font-medium text-[#302622] transition hover:border-[#6e181b] hover:text-[#6e181b]">
            {topic.title}
          </Link>
        ))}
      </div>
      <div id="dang-ky" className="landing-page-shell__newsletter">
        <div>
          <p>Cùng HISGO</p>
          <h2>Lan tỏa giá trị lịch sử Việt Nam</h2>
          <small>
            Đồng hành cùng bạn khám phá, hiểu và yêu hơn lịch sử dân tộc.
          </small>
        </div>
        <NewsletterSignup />
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

export default async function HomePage() {
  const landing = await fetchLandingContent();

  const stages: ExploreStage[] = landing.chapters.map((chapter) => ({
    id: chapter.id,
    tab: chapter.eyebrow || chapter.title,
    period: "",
    text: chapter.description,
    image: chapter.image,
    href: chapter.href,
  }));

  return (
    <div className="landing-page-shell">
      <div className="landing-page-shell__content-panel">
        <SiteHeader activeSectionId="explore" />
        <main>
          <Hero />
          <Timeline eras={landing.eras} />
          <FeaturedStory />
          <Characters figures={landing.figures} />
          <section className="landing-page-shell__shell landing-page-shell__explore" id="explore">
            <SectionTitle
              title="Khám phá giai đoạn"
              subtitle="Lựa chọn giai đoạn lịch sử bạn quan tâm để bắt đầu hành trình khám phá"
            />
            <ExplorePeriodTabs stages={stages} />
          </section>
          <Knowledge topics={landing.knowledgeTopics} />
        </main>
        <Footer />
      </div>
    </div>
  );
}
