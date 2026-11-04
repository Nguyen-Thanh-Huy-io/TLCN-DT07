import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Clock3, Map, MapPin } from "lucide-react";
import type { EventReaderModel } from "./ce-types";

export function EventHero({ model }: { model: EventReaderModel }) {
  return (
    <section className="ce-hero">
      <nav className="ce-breadcrumbs" aria-label="Đường dẫn">
        <Link href="/dong-thoi-gian">Dòng thời gian</Link>
        {model.periodHref && (
          <>
            <ChevronRight />
            <Link href={model.periodHref}>{model.periodName}</Link>
          </>
        )}
        {model.parent && (
          <>
            <ChevronRight />
            <Link href={model.parent.href}>{model.parent.title}</Link>
          </>
        )}
        <ChevronRight />
        <span>{model.title}</span>
      </nav>
      <div className="ce-hero-grid">
        <div>
          <div className="ce-hero-badges">
            {model.periodName && <span className="ce-badge">{model.periodName}</span>}
            <span className="ce-badge">{model.categoryLabel}</span>
          </div>
          <p className="ce-hero-date">
            <span />
            {model.dateLabel}
          </p>
          <h1>{model.title}</h1>
          {model.lead && <p className="ce-hero-deck">{model.lead}</p>}
          <div className="ce-hero-meta">
            <span>
              <Clock3 /> {model.readMinutes} phút đọc
            </span>
            {model.locationLabel && (
              <span>
                <MapPin /> {model.locationLabel}
              </span>
            )}
            <span>
              <BookOpen /> {model.sections.length} mục
            </span>
          </div>
        </div>
        {model.imageUrl ? (
          <figure className="ce-hero-image">
            <img src={model.imageUrl} alt={model.title} />
          </figure>
        ) : (
          <div className="ce-hero-emblem" aria-hidden="true">
            <span className="ce-sun-disc" />
            <svg viewBox="0 0 320 250">
              <path d="M0 206L42 166l26 17 43-68 45 65 40-34 33 34 42-76 49 76v70H0Z" />
              <path d="M0 224l66-34 58 18 73-38 123 42v38H0Z" opacity=".55" />
              <path d="M191 213v-74m-28 74h58M174 180h34m-39-19h44M181 140l10-17 11 17" fill="none" stroke="currentColor" strokeWidth="4" />
              <path d="M65 219v-66m0 1 43 12-43 18" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <small>{model.dateLabel.toUpperCase()}</small>
          </div>
        )}
      </div>
    </section>
  );
}

export function EventQuickNav({ model }: { model: EventReaderModel }) {
  return (
    <section className="ce-quick-nav">
      <span className="ce-quick-label">TIẾP TỤC KHÁM PHÁ</span>
      <div>
        {model.previous ? (
          <Link href={model.previous.href} className="ce-previous">
            <ArrowLeft />
            <span>
              <small>SỰ KIỆN TRƯỚC · {model.previous.dateLabel}</small>
              <strong>{model.previous.title}</strong>
            </span>
          </Link>
        ) : (
          <span />
        )}
        <Link href="/dong-thoi-gian" className="ce-button">
          <Map /> Quay lại dòng thời gian
        </Link>
        {model.next ? (
          <Link href={model.next.href} className="ce-next">
            <span>
              <small>SỰ KIỆN TIẾP THEO · {model.next.dateLabel}</small>
              <strong>{model.next.title}</strong>
            </span>
            <ArrowRight />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </section>
  );
}
