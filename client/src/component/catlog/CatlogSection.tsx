"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Lock } from "lucide-react";
import { toast } from "sonner";
import { products } from "./catlogData";
import { useTranslation } from "../../i18n/LanguageProvider";

export default function CatlogSection() {
  const { t } = useTranslation();
  const items = products.slice(0, 3);
  const [active, setActive] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      fetch("/api/catalog/status")
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setUnlocked(Boolean(data.unlocked));
        })
        .catch(() => {
          if (!cancelled) setUnlocked(false);
        });
    };

    check();
    window.addEventListener("catalog:unlocked", check);
    return () => {
      cancelled = true;
      window.removeEventListener("catalog:unlocked", check);
    };
  }, []);

  const goToContact = () => {
    toast.message(t("home.catalog.lockTitle"), {
      description: t("home.catalog.lockDesc"),
    });
    const el = document.getElementById("contact");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleDownload = (id: number, category: string) => {
    if (!unlocked) {
      goToContact();
      return;
    }
    window.location.href = `/api/catalog/download?id=${id}`;
    toast.success(t("home.catalog.downloadStarted"), {
      description: category,
    });
  };

  return (
    <section className="pb-16 lg:pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {!unlocked && (
          <p className="mb-6 text-sm text-[#6B6B6B]">
            {t("home.catalog.lockHint")}{" "}
            <button
              type="button"
              onClick={goToContact}
              className="font-semibold text-[#E0905A] hover:underline"
            >
              {t("home.catalog.lockCta")}
            </button>
          </p>
        )}

        <div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 h-auto sm:h-[520px] lg:h-[600px]"
          onMouseLeave={() => setActive(null)}
        >
          {items.map((item, index) => {
            const isActive = active === index;
            const isIdle = active === null;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                tabIndex={0}
                className={`group relative flex flex-col min-w-0 overflow-hidden transition-[flex] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none ${
                  isIdle
                    ? "sm:flex-1"
                    : isActive
                      ? "sm:flex-[2.4]"
                      : "sm:flex-[0.8]"
                }`}
              >
                <div className="relative w-full h-[320px] sm:h-full overflow-hidden rounded-2xl">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className={`object-cover transition-transform duration-700 ease-out ${
                      isActive ? "scale-105" : "scale-100"
                    }`}
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>

                <div
                  className={`mt-4 flex items-end justify-between gap-3 transition-opacity duration-500 ${
                    isIdle || isActive ? "opacity-100" : "opacity-70"
                  }`}
                >
                  <div>
                    <p className="text-[11px] tracking-[0.18em] uppercase text-[#E0905A] font-semibold mb-1">
                      {item.category}
                    </p>
                    <p className="text-sm sm:text-base font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
                      {item.title}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(item.id, item.category)}
                    aria-label={
                      unlocked
                        ? `Download ${item.category} catalogue`
                        : `Unlock ${item.category} catalogue`
                    }
                    className="shrink-0 inline-flex items-center justify-center text-[#E0905A] hover:text-[#1A1A1A] transition-colors"
                  >
                    {unlocked ? <Download size={22} /> : <Lock size={22} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show ${item.category} catalogue`}
              onClick={() => setActive(index)}
              className={`h-2.5 w-2.5 rounded-full border transition-colors duration-300 ${
                active === index
                  ? "border-[#1A1A1A] bg-white"
                  : "border-[#C8C0B6] bg-[#D8D2C8]"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
