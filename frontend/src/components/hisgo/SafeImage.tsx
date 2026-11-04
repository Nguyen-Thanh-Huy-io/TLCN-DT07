"use client";
import React, { useState } from "react";
import Image from "next/image";
import { USE_IMAGES } from "@/config";

interface SafeImageProps {
  src: string;
  alt: string;
  fallbackGradient?: string;
  fallbackLetter?: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
  objectFit?: "cover" | "contain";
}

export function SafeImage({
  src,
  alt,
  fallbackGradient = "linear-gradient(135deg, #14233F 0%, #3D2214 50%, #85481B 100%)",
  fallbackLetter,
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  objectFit = "cover",
}: SafeImageProps) {
  const [error, setError] = useState(false);

  if (!USE_IMAGES || error || !src) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center transition-all ${className}`}
        style={{ background: fallbackGradient }}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={!alt}
      >
        {fallbackLetter && (
          <span className="font-bold text-white/90 font-[family-name:var(--font-heading)] text-lg sm:text-xl drop-shadow select-none">
            {fallbackLetter}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        quality={75}
        style={{ objectFit }}
        onError={() => setError(true)}
        className="transition-transform duration-500 ease-out"
      />
    </div>
  );
}
