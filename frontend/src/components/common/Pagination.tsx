"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
  itemLabel = "mục",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Tạo dải số trang hiển thị gọn gàng (kèm dấu ...)
  const paginationRange = useMemo(() => {
    const delta = 1;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav className={`sk-pagination-container ${className}`} aria-label="Điều hướng phân trang">
      <div className="sk-pagination-info">
        Hiển thị <strong>{startIdx}–{endIdx}</strong> trong số <strong>{totalItems}</strong> {itemLabel}
      </div>

      <div className="sk-pagination-controls">
        <button
          type="button"
          className="sk-pagination-btn sk-pagination-prev"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} />
          <span>Trước</span>
        </button>

        <div className="sk-pagination-numbers">
          {paginationRange.map((page, index) => {
            if (page === "...") {
              return (
                <span key={`dots-${index}`} className="sk-pagination-dots">
                  ...
                </span>
              );
            }

            const pageNum = Number(page);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                className={`sk-pagination-num-btn ${isActive ? "sk-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="sk-pagination-btn sk-pagination-next"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Trang sau"
        >
          <span>Sau</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
