"use client";
import React, { useState } from "react";
import { newsletterData } from "@/data/newsletter";
import { OrnamentFrame } from "@/components/hisgo/OrnamentFrame";
import Image from "next/image";
import { FormStatus } from "@/constants/enums";
import { USE_IMAGES } from "@/config";

export function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<FormStatus>(FormStatus.IDLE);
  const [responseMessage, setResponseMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setStatus(FormStatus.ERROR);
      setResponseMessage(newsletterData.errorMessage);
      return;
    }

    setStatus(FormStatus.LOADING);
    setResponseMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), honeypot }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setStatus(FormStatus.SUCCESS);
        setResponseMessage(data.message || newsletterData.successMessage);
        setEmail("");
      } else {
        setStatus(FormStatus.ERROR);
        setResponseMessage(data.message || newsletterData.errorMessage);
      }
    } catch {
      setStatus(FormStatus.ERROR);
      setResponseMessage(newsletterData.errorMessage);
    }
  };

  return (
    <div className="relative w-full min-h-[150px] lg:h-[160px] rounded-[10px] overflow-hidden shadow-[var(--shadow-card)] border border-[var(--border-gold)]/60 flex items-center bg-[var(--bg-surface)]">
      {/* Background Image: Khi USE_IMAGES = true mới load ảnh, khi false thì dùng nền gradient kem sạch sẽ */}
      {USE_IMAGES ? (
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <Image
            src="/assets/newsletter-banner.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Lớp phủ mỏng để đảm bảo độ tương phản đọc chữ tốt nhất */}
          <div className="absolute inset-0 bg-[#FAF6EA]/25" aria-hidden="true" />
        </div>
      ) : (
        <div
          className="absolute inset-0 z-0 pointer-events-none select-none"
          style={{
            background: "linear-gradient(135deg, #FAF6EA 0%, #F5EEDC 50%, #ECE0C6 100%)",
          }}
          aria-hidden="true"
        />
      )}

      <OrnamentFrame
        cornerSize={22}
        className="w-full !p-5 sm:!p-6 lg:!py-5 lg:!px-8 !bg-transparent relative z-10 border-0"
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5 lg:gap-8 relative z-10 w-full">
          {/* VÙNG TRÁI: TIÊU ĐỀ & MÔ TẢ (Mobile chữ trên, desktop bên trái) */}
          <div className="w-full lg:w-[48%] text-left space-y-1.5">
            <h3 className="text-lg sm:text-xl lg:text-[22px] font-bold font-[family-name:var(--font-heading)] leading-snug">
              <span className="block text-[var(--primary)] font-extrabold">{newsletterData.titleLine1}</span>
              <span className="block text-[var(--ink)]">{newsletterData.titleLine2}</span>
            </h3>
            <p className="text-xs sm:text-[13px] text-[var(--text-body)] font-[family-name:var(--font-body)] leading-relaxed line-clamp-2">
              {newsletterData.description}
            </p>
          </div>

          {/* VÙNG PHẢI: FORM ĐĂNG KÝ EMAIL (Mobile form dưới, Desktop ở giữa-phải) */}
          <div className="w-full lg:w-[46%] relative">
            <form onSubmit={handleSubmit} className="w-full relative">
              {/* Honeypot field ẩn chống bot */}
              <input
                type="text"
                name="b_name"
                tabIndex={-1}
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                autoComplete="off"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 bg-white/70 backdrop-blur-sm p-1 rounded-[var(--radius-btn)] border border-[var(--border-gold)]/70 shadow-sm">
                <label htmlFor="newsletter-email" className="sr-only">
                  {newsletterData.inputPlaceholder}
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === FormStatus.ERROR) setStatus(FormStatus.IDLE);
                  }}
                  disabled={status === FormStatus.LOADING}
                  placeholder={newsletterData.inputPlaceholder}
                  aria-invalid={status === FormStatus.ERROR}
                  aria-describedby="newsletter-status-message"
                  className="w-full sm:flex-1 h-10 px-3 bg-transparent text-sm text-[var(--ink)] placeholder-[var(--text-muted)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={status === FormStatus.LOADING}
                  className="h-10 px-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-70 text-white font-medium text-sm rounded-[calc(var(--radius-btn)-2px)] transition-colors shadow-sm flex items-center justify-center gap-2 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] cursor-pointer"
                >
                  {status === FormStatus.LOADING ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{newsletterData.buttonText}</span>
                  )}
                </button>
              </div>

              {/* Thông báo trạng thái: dùng absolute để không đẩy lệch vị trí form */}
              <div
                id="newsletter-status-message"
                aria-live="polite"
                className="absolute -bottom-6 left-0 right-0 text-left"
              >
                {status === FormStatus.SUCCESS && (
                  <p className="text-xs font-semibold text-emerald-800 animate-fadeIn truncate">
                    ✓ {responseMessage}
                  </p>
                )}
                {status === FormStatus.ERROR && (
                  <p className="text-xs font-semibold text-rose-800 animate-fadeIn truncate">
                    ✕ {responseMessage}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </OrnamentFrame>
    </div>
  );
}
