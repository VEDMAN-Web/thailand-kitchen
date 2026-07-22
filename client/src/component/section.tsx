"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../i18n/LanguageProvider";
import type { TranslationKey } from "../i18n/translations";

const stats = [
  { titleKey: "home.stats.years" as TranslationKey, from: 1, to: 15, suffix: "+" },
  { titleKey: "home.stats.cities" as TranslationKey, from: 1, to: 12, suffix: "" },
  { titleKey: "home.stats.kitchens" as TranslationKey, from: 100, to: 800, suffix: "+" },
];

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function CountValue({
  from,
  to,
  suffix,
  active,
  duration = 1600,
}: {
  from: number;
  to: number;
  suffix: string;
  active: boolean;
  duration?: number;
}) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!active) return;

    // Respect users who ask for reduced motion — jump straight to the end.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setValue(to);
      return;
    }

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(from + (to - from) * easeOut(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, from, to, duration]);

  return (
    <>
      {value}
      {suffix}
    </>
  );
}

export default function StatsSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let done = false;
    let io: IntersectionObserver | null = null;

    const isVisible = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight || document.documentElement.clientHeight;
      return rect.top < viewH * 0.9 && rect.bottom > 0;
    };

    const cleanup = () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    const fire = () => {
      if (done) return;
      done = true;
      setActive(true);
      cleanup();
    };

    function onScroll() {
      if (isVisible()) fire();
    }

    // Already on screen at mount (hard refresh mid-page, short viewport).
    if (isVisible()) {
      fire();
      return;
    }

    // No IntersectionObserver support → just show the final numbers.
    if (typeof IntersectionObserver === "undefined") {
      fire();
      return;
    }

    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) fire();
      },
      { threshold: [0, 0.2] }
    );
    io.observe(el);

    // Safety net for late layout shifts (fonts/video resizing the hero).
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return cleanup;
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#1A1A1A] py-10 lg:py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-stretch">
          {stats.map((item, index) => (
            <div
              key={item.titleKey}
              className={`flex-1 text-center py-5 sm:py-0 px-4 sm:px-8 ${
                index < stats.length - 1
                  ? "border-b sm:border-b-0 sm:border-r border-white/15"
                  : ""
              }`}
            >
              <p className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight tabular-nums">
                <CountValue
                  from={item.from}
                  to={item.to}
                  suffix={item.suffix}
                  active={active}
                />
              </p>
              <p className="mt-2 text-sm md:text-base text-white/55">
                {t(item.titleKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}