"use client";

import { useTranslation } from "../../i18n/LanguageProvider";
import type { TranslationKey } from "../../i18n/translations";

const craftItems = [
  { id: "01", key: 1 },
  { id: "02", key: 2 },
  { id: "03", key: 3 },
  { id: "04", key: 4 },
] as const;

export default function CraftBar() {
  const { t } = useTranslation();

  return (
    <section className="bg-[#1A1A1A] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 lg:py-12">
        <div className="flex flex-col sm:flex-row items-stretch">
          {craftItems.map((item, index) => (
            <div
              key={item.id}
              className={`flex-1 py-5 sm:py-0 px-0 sm:px-6 lg:px-8 first:sm:pl-0 last:sm:pr-0 ${
                index < craftItems.length - 1
                  ? "border-b sm:border-b-0 sm:border-r border-[#5A5A5A]"
                  : ""
              }`}
            >
              <p className="text-[#B38B6D] text-xs tracking-[0.2em] mb-3">
                {item.id}
              </p>
              <h3 className="text-base lg:text-lg font-semibold mb-2">
                {t(`home.craft.${item.key}.title` as TranslationKey)}
              </h3>
              <p className="text-white/55 text-sm leading-6">
                {t(`home.craft.${item.key}.desc` as TranslationKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
