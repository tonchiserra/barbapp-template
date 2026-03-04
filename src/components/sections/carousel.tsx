"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CarouselSettings, CarouselSlide, ButtonVariant } from "@/types";

interface CarouselProps {
  settings: CarouselSettings;
  className?: string;
}

const CTA_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline:
    "border border-current bg-transparent hover:bg-white/10",
  ghost:
    "bg-transparent hover:bg-white/10",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const H_ALIGN_MAP = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
} as const;

const V_ALIGN_MAP = {
  top: "justify-start",
  center: "justify-center",
  bottom: "justify-end",
} as const;

export function Carousel({ settings, className }: CarouselProps) {
  const [current, setCurrent] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const touchStartX = React.useRef(0);

  const { slides } = settings;

  if (!settings.is_visible || slides.length === 0) return null;

  const goTo = (index: number) => {
    setCurrent((index + slides.length) % slides.length);
  };

  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  // Auto-slide
  React.useEffect(() => {
    if (!settings.auto_slide || slides.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length, settings.auto_slide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      delta > 0 ? next() : prev();
    }
  };

  return (
    <section
      id="Carrusel"
      className={cn("relative w-full overflow-hidden", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/9]">
        {slides.map((slide, index) => (
          <Slide
            key={index}
            slide={slide}
            active={index === current}
          />
        ))}
      </div>

      {/* Navigation arrows (desktop, multiple slides) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50 md:block"
            aria-label="Slide anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50 md:block"
            aria-label="Siguiente slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === current
                  ? "w-6 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/70",
              )}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Slide({ slide, active }: { slide: CarouselSlide; active: boolean }) {
  const hasCta = slide.cta_label && slide.cta_url;

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity duration-500",
        active ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      {/* Desktop image */}
      {slide.image_desktop && (
        <Image
          src={slide.image_desktop}
          alt={slide.title || "Slide"}
          fill
          className="hidden object-cover sm:block"
          priority={active}
        />
      )}

      {/* Mobile image (falls back to desktop) */}
      <Image
        src={slide.image_mobile || slide.image_desktop}
        alt={slide.title || "Slide"}
        fill
        className="object-cover sm:hidden"
        priority={active}
      />

      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <div
        className={cn(
          "relative flex h-full flex-col gap-4 p-6 sm:p-12 lg:p-16",
          H_ALIGN_MAP[slide.align_h],
          V_ALIGN_MAP[slide.align_v],
        )}
        style={{ color: slide.text_color }}
      >
        {slide.title && (
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {slide.title}
          </h2>
        )}
        {slide.subtitle && (
          <p className="max-w-xl text-base opacity-90 sm:text-lg">
            {slide.subtitle}
          </p>
        )}
        {hasCta && (
          <a
            href={slide.cta_url}
            className={cn(
              "mt-2 inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200",
              CTA_STYLES[slide.cta_variant],
            )}
          >
            {slide.cta_label}
          </a>
        )}
      </div>
    </div>
  );
}
