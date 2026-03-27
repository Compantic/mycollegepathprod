"use client";

import { useState } from "react";
import Image from "next/image";
import { BarChart2, Check } from "lucide-react";

/**
 * Hero right-side visual: horizontal card with campus photo (left) and
 * glassmorphism overlay on the right half only.
 */
const HERO_IMAGE = "/campus.jpg";

export function HeroVisual() {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="relative w-full max-w-[560px] mx-auto lg:mx-0 overflow-x-hidden">
      <div
        className="relative w-full aspect-[16/10] min-h-[280px] rounded-card overflow-hidden border border-bg-border shadow-soft"
        style={{ boxShadow: "0 24px 48px rgba(15, 23, 42, 0.12)" }}
      >
        {/* Full-bleed photo or gradient fallback */}
        <div className="absolute inset-0">
          {!imgFailed ? (
            <Image
              src={HERO_IMAGE}
              alt="Students on campus"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 560px"
              priority
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-secondary-100 to-primary-600/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10" />
        </div>

        {/* Glassmorphism overlay */}
        <div className="absolute inset-x-0 bottom-3 sm:bottom-0 sm:top-0 sm:right-0 sm:left-auto w-full sm:w-[52%] sm:min-w-[240px] flex items-center justify-center sm:justify-end px-3 sm:px-0">
          <div className="h-[85%] w-full sm:mr-3 rounded-card bg-white/80 backdrop-blur-xl border border-white/60 shadow-soft flex flex-col justify-center p-4 sm:p-5">
            <div className="space-y-3 mb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Graduation rate
                  </div>
                  <div className="text-lg font-bold text-text-primary">95%</div>
                </div>
                <div className="text-primary-600">
                  <BarChart2 className="h-5 w-5" aria-hidden />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Career placement
                  </div>
                  <div className="text-lg font-bold text-text-primary">89%</div>
                </div>
                <div className="text-primary-600">
                  <BarChart2 className="h-5 w-5" aria-hidden />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="rounded-button bg-secondary-200/90 text-text-secondary text-xs font-medium px-2.5 py-1">
                school
              </span>
              <span className="rounded-button bg-secondary-200/90 text-text-secondary text-xs font-medium px-2.5 py-1">
                trophy
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-muted">
                  College match
                </div>
                <div className="font-bold text-status-successText">MATCHED!</div>
              </div>
              <div
                className="rounded-full bg-status-successText text-white flex items-center justify-center h-9 w-9 shrink-0"
                aria-hidden
              >
                <Check className="h-5 w-5" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-muted pt-1 border-t border-bg-border">
              <span>Scholarships</span>
              <span>Achievements</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
