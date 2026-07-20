"use client";

import { useState } from "react";
import Image from "next/image";
import {
  galleryItems,
  galleryCategories,
  type GalleryCategory,
} from "./galleryData";
import { useTranslation } from "../../i18n/LanguageProvider";
import type { TranslationKey } from "../../i18n/translations";

const categoryKeyMap: Record<GalleryCategory, TranslationKey> = {
  All: "gallery.filter.all",
  "Layout & Space": "gallery.filter.layout",
  Storage: "gallery.filter.storage",
  "Style & Color": "gallery.filter.style",
  Materials: "gallery.filter.materials",
};

export default function GalleryContent() {
  const { t } = useTranslation();
  const [active, setActive] = useState<GalleryCategory>("All");

  const items =
    active === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.filter === active);

  return (
    <section className="pb-16 lg:pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-8 lg:mb-10">
          {galleryCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                active === cat
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#4A4A4A] hover:text-[#1A1A1A]"
              }`}
            >
              {t(categoryKeyMap[cat])}
            </button>
          ))}
        </div>

        {/* Mosaic grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 auto-rows-[150px] sm:auto-rows-[190px] lg:auto-rows-[215px] [grid-auto-flow:dense]">
          {items.map((item, i) => {
            // Repeating mosaic: big-left + stacked-right, then stacked-left + big-right, then full-width.
            const pos = i % 7;
            const isTall = pos === 0 || pos === 4;
            const isWide = pos === 6;

            // Tall images pan across full width; small + wide (last) images pan full height.
            const panClass = isTall
              ? "object-left group-hover:object-right"
              : "object-top group-hover:object-bottom";

            return (
              <article
                key={item.id}
                className={`group relative overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] ${
                  isTall ? "row-span-2" : ""
                } ${isWide ? "col-span-2 row-span-2" : ""}`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className={`object-cover transition-[object-position] duration-[3500ms] ease-linear ${panClass}`}
                  sizes={isWide ? "100vw" : "(max-width: 1024px) 50vw, 45vw"}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
