"use client";

import FeatureCard from "./FeatureCard";
import { featureData } from "./featureData";
import { useTranslation } from "../../i18n/LanguageProvider";
import type { TranslationKey } from "../../i18n/translations";

export default function FeatureSection() {
  const { t } = useTranslation();

  return (
    <section className="pb-6 lg:pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {featureData.map((item) => (
            <FeatureCard
              key={item.id}
              item={{
                title: t(`home.features.${item.id}.title` as TranslationKey),
                description: t(`home.features.${item.id}.desc` as TranslationKey),
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
