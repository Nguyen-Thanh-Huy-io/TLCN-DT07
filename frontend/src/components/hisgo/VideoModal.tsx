"use client";
import React, { useEffect, useRef } from "react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
}

export function VideoModal({ isOpen, onClose, videoUrl }: VideoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Khóa cuộn trang khi mở modal và trap focus
  useEffect(() => {
    if (!isOpen) return;

    // Lưu lại overflow cũ và khóa cuộn body
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus vào nút đóng khi modal mở
    closeButtonRef.current?.focus();

    // Lắng nghe phím ESC và Tab để trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
    >
      {/* Backdrop mờ tối, click ra ngoài để đóng */}
      <div
        className="fixed inset-0 bg-[var(--overlay-ink)]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-[var(--bg-surface)] border border-[var(--border-gold)] rounded-[var(--radius-hero)] shadow-2xl overflow-hidden z-10"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-page)]">
          <h3
            id="video-modal-title"
            className="text-base font-bold font-[family-name:var(--font-heading)] text-[var(--ink)]"
          >
            Khám phá lịch sử qua Video
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-surface)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            aria-label="Đóng video"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Video Player or Fallback */}
        <div className="relative aspect-video w-full bg-[var(--overlay-ink)] flex items-center justify-center">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              title="Khám phá qua video"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-[var(--ink)]/50 border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold)]">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <p className="text-base font-semibold font-[family-name:var(--font-heading)] text-[var(--on-dark)]">
                Video sắp ra mắt
              </p>
              <p className="text-xs text-[var(--on-dark-muted)] max-w-sm mx-auto">
                Tư liệu video lịch sử đang được biên tập và sẽ sớm phát hành để gửi tới quý độc giả.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
