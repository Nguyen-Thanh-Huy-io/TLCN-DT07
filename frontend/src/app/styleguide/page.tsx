import React from "react";
import Link from "next/link";
import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { SectionTitle } from "@/components/hisgo/SectionTitle";
import { OrnamentFrame } from "@/components/hisgo/OrnamentFrame";

export default function StyleguidePage() {
  const colorTokens = [
    { name: "--bg-page", hex: "#F5EEDC", desc: "Nền toàn trang", darkText: true },
    { name: "--bg-surface", hex: "#FAF6EA", desc: "Card sáng, ô chủ đề, input", darkText: true },
    { name: "--bg-header", hex: "rgba(245,238,220,0.92)", desc: "Header sticky + backdrop-blur", darkText: true },
    { name: "--ink", hex: "#14233F", desc: "Tiêu đề, logo, tên", darkText: false },
    { name: "--text-body", hex: "#4A3F33", desc: "Đoạn mô tả", darkText: false },
    { name: "--text-muted", hex: "#7A6B57", desc: "Phụ đề, niên đại, copyright", darkText: false },
    { name: "--on-dark", hex: "#FFFFFF", desc: "Tiêu đề trên ảnh", darkText: true },
    { name: "--on-dark-muted", hex: "rgba(255,255,255,0.85)", desc: "Mô tả trên ảnh", darkText: true },
    { name: "--primary", hex: "#7A1F24", desc: "Nút chính, nav active, submit", darkText: false },
    { name: "--primary-hover", hex: "#651A1E", desc: "Hover nút chính", darkText: false },
    { name: "--gold", hex: "#B8893F", desc: "Icon, ornament, đường kẻ", darkText: false },
    { name: "--gold-light", hex: "#D4AE67", desc: "Viền vòng node, hover", darkText: true },
    { name: "--border", hex: "#E2D5B8", desc: "Viền card sáng, viền header", darkText: true },
    { name: "--border-gold", hex: "#C9A45C", desc: "Khung ornament", darkText: false },
    { name: "--overlay-ink", hex: "#0B1730", desc: "Gốc của gradient phủ ảnh", darkText: false },
  ];

  return (
    <div className="hisgo-theme min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-body)]">
      <Header activeTab="" />

      <main className="w-full flex-1 py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 space-y-16">
          {/* Page Heading */}
          <div className="border-b border-[var(--border)] pb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] text-[var(--ink)]">
                HISGO Design System & Styleguide
              </h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Bảng thông số Design Tokens, Typography, Buttons và Components Bước 1 cho dự án HISGO.
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 border border-[var(--border-gold)] rounded-[var(--radius-btn)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--bg-surface)] transition-colors"
            >
              ← Về Trang Chủ
            </Link>
          </div>

          {/* 1. BẢNG MÀU (COLOR PALETTE & TOKENS) */}
          <section>
            <SectionTitle
              title="1. Bảng màu & Design Tokens"
              subtitle="Tất cả màu sắc được map từ CSS variables trên :root vào hệ thống Tailwind theme"
            />

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {colorTokens.map((token) => (
                <div
                  key={token.name}
                  className="p-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm space-y-3"
                >
                  <div
                    className="w-full h-16 rounded-[var(--radius-btn)] border border-[var(--border)] flex items-center justify-center font-mono text-xs font-bold"
                    style={{
                      backgroundColor: token.hex,
                      color: token.darkText ? "#14233F" : "#FFFFFF",
                    }}
                  >
                    {token.hex}
                  </div>
                  <div>
                    <code className="text-xs font-bold text-[var(--ink)] block">
                      {token.name}
                    </code>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {token.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. TYPOGRAPHY */}
          <section>
            <SectionTitle
              title="2. Typography Tiếng Việt"
              subtitle="Kiểm tra hiển thị đầy đủ dấu: 'Mỗi dấu mốc, một câu chuyện Việt Nam'"
            />

            <div className="mt-7">
              <OrnamentFrame className="space-y-6">
                <div className="space-y-1 border-b border-[var(--border)] pb-4">
                  <span className="text-xs text-[var(--text-muted)] font-mono">H1 (Noto Serif 700 - 2.5rem)</span>
                  <h1 className="text-4xl font-bold font-[family-name:var(--font-heading)] text-[var(--ink)]">
                    Mỗi dấu mốc, một câu chuyện Việt Nam
                  </h1>
                </div>

                <div className="space-y-1 border-b border-[var(--border)] pb-4">
                  <span className="text-xs text-[var(--text-muted)] font-mono">H2 (Noto Serif 700 - 1.875rem)</span>
                  <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--ink)]">
                    Dòng chảy lịch sử Việt Nam qua các triều đại hào hùng
                  </h2>
                </div>

                <div className="space-y-1 border-b border-[var(--border)] pb-4">
                  <span className="text-xs text-[var(--text-muted)] font-mono">H3 (Noto Serif 600 - 1.35rem)</span>
                  <h3 className="text-xl font-semibold font-[family-name:var(--font-heading)] text-[var(--ink)]">
                    Thời kỳ vàng son của Đại Việt - Lý, Trần, Lê
                  </h3>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-[var(--text-muted)] font-mono">Body & Muted (Be Vietnam Pro 400/500)</span>
                  <p className="text-sm text-[var(--text-body)] font-[family-name:var(--font-body)] leading-relaxed">
                    Khám phá lịch sử Việt Nam qua những dòng thời gian sống động, những câu chuyện ý nghĩa và những nhân vật kiệt xuất đã hiến dâng trọn đời cho nền độc lập dân tộc.
                  </p>
                  <p className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-body)] pt-1">
                    Phụ đề & Niên đại: Từ thời Tiền sử (trước 2879 TCN) đến Thời hiện đại (1945 - nay).
                  </p>
                </div>
              </OrnamentFrame>
            </div>
          </section>

          {/* 3. BUTTONS */}
          <section>
            <SectionTitle
              title="3. Nút hành động (Buttons)"
              subtitle="Nút Primary (Đỏ đô #7A1F24) & Nút Outline viền Gold"
            />

            <div className="mt-7 flex flex-wrap items-center justify-center gap-4 p-8 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-card)]">
              {/* Primary Button */}
              <button
                type="button"
                className="px-6 py-2.5 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-medium text-sm rounded-[var(--radius-btn)] transition-colors shadow-sm flex items-center gap-2"
              >
                <span>Bắt đầu khám phá</span>
                <span aria-hidden="true">→</span>
              </button>

              {/* Outline Button with Gold Border */}
              <button
                type="button"
                className="px-6 py-2.5 bg-transparent border border-[var(--gold)] text-[var(--ink)] hover:bg-[var(--bg-page)] font-medium text-sm rounded-[var(--radius-btn)] transition-colors flex items-center gap-2"
              >
                <span>Xem hành trình</span>
                <span className="text-[var(--gold)] text-xs" aria-hidden="true">▶</span>
              </button>

              {/* Gold Light Tag */}
              <span className="px-3 py-1 bg-[var(--bg-page)] border border-[var(--border-gold)] text-[var(--ink)] text-xs font-semibold rounded-[var(--radius-btn)]">
                Tag: Khởi nghĩa Lam Sơn
              </span>
            </div>
          </section>

          {/* 4. COMPONENTS: SECTION TITLE & ORNAMENT FRAME */}
          <section>
            <SectionTitle
              title="4. Components Mẫu: SectionTitle & OrnamentFrame"
              subtitle="Hai component nền tảng được dùng cho toàn bộ hệ thống giao diện"
            />

            <div className="mt-7">
              <OrnamentFrame className="max-w-2xl mx-auto text-center space-y-4 py-8">
                <span className="text-xs tracking-wider uppercase text-[var(--gold)] font-bold">
                  Ví dụ OrnamentFrame
                </span>
                <h3 className="text-lg font-bold font-[family-name:var(--font-heading)] text-[var(--ink)]">
                  Khung viền viền hoa văn góc vuông cổ phong
                </h3>
                <p className="text-xs md:text-sm text-[var(--text-muted)] max-w-md mx-auto">
                  Component OrnamentFrame bọc nội dung với viền gold mảnh và 4 góc vuông trang trí, nhận children linh hoạt cho thẻ trích dẫn, thông báo hoặc card đặc biệt.
                </p>
              </OrnamentFrame>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
