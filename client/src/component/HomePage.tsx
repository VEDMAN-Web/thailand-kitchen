"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import StatsSection from "./section";
import AboutSection from "./about/AboutSection";
import CraftBar from "./features/CraftBar";
import ProductSection from "./Home/ProductSection";
import TestimonialSection from "./imageFeedback/TestimonialSection";
import BrandSlider from "./brandLogo/BrandSlider";
import FeatureSection from "./features/FeatureSection";
import CatalogSection from "./catlog/CatlogSection";
import ContactSection from "./contactUs/ContactSection";
import Footer from "./Footer/footer";
import { useTranslation } from "../i18n/LanguageProvider";

function HomePage() {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        /* Autoplay may be blocked until user interaction */
      });
    }
  }, []);

  return (
    <div className="w-full relative bg-[#F5F3EF]">
      {/* Hero stays clipped; stats sit outside overflow-hidden so count-up can detect visibility */}
      <div className="relative overflow-hidden">
        <section className="bg-[#F5F3EF] px-3 pb-3 pt-[80px] sm:px-4 sm:pb-4 sm:pt-[84px]">
          <div className="relative w-full h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              src="/video/2.mp4?v=3"
              onCanPlay={() => {
                videoRef.current?.play().catch(() => {});
              }}
              className="absolute inset-0 z-0 w-full h-full object-cover pointer-events-none"
            />

            <div className="absolute inset-0 bg-black/45" />

            <div className="absolute inset-0 z-10">
              <div className="max-w-[1440px] mx-auto h-full px-6 sm:px-8 lg:px-12">
                <div className="absolute bottom-14 lg:bottom-20 left-6 sm:left-8 lg:left-12 right-6 sm:right-8 lg:right-12 max-w-4xl">
                  <p className="uppercase tracking-[0.28em] text-[#C4A484] text-xs sm:text-sm font-medium mb-4">
                    {t("home.hero.eyebrow")}
                  </p>

                  <h1 className="text-white font-extrabold leading-tight text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-wide uppercase whitespace-nowrap">
                    {t("home.hero.title")}
                  </h1>

                  <p className="mt-5 max-w-lg text-white/85 text-sm sm:text-base leading-7">
                    {t("home.hero.description")}
                  </p>

                  <Link
                    href="/contact"
                    className="mt-8 inline-flex items-center gap-2 bg-white text-[#1A1A1A] px-7 py-3.5 rounded-full text-sm font-semibold hover:bg-gray-100 transition"
                  >
                    {t("home.hero.cta")}
                    <span aria-hidden>↗</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <BrandSlider />

      <div className="relative overflow-hidden">
        <AboutSection />
        <CraftBar />

        <section className="pt-16 lg:pt-24 pb-10 lg:pb-12">
          <div className="max-w-7xl mx-auto px-6 flex items-end justify-between gap-6">
            <div>
              <p className="text-[#E0905A] text-xs tracking-[0.28em] uppercase font-medium mb-3">
                {t("home.products.eyebrow")}
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1A1A1A]">
                {t("home.products.title")}
              </h2>
            </div>
            <Link
              href="/products"
              className="shrink-0 hidden sm:inline-flex gap-2 items-center bg-[#1A1A1A] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-black transition"
            >
              {t("home.products.cta")}
              <span aria-hidden>↗</span>
            </Link>
          </div>
        </section>
        <ProductSection />

        <section className="pt-10 lg:pt-12 pb-10 lg:pb-12">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[#E0905A] text-xs tracking-[0.28em] uppercase font-medium mb-3">
              {t("home.testimonials.eyebrow")}
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1A1A1A]">
              {t("home.testimonials.title")}
            </h2>
          </div>
        </section>
        <TestimonialSection />

        <StatsSection />

        <section className="pt-10 lg:pt-12 pb-10 lg:pb-12">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[#E0905A] text-xs tracking-[0.28em] uppercase font-medium mb-3">
              {t("home.features.eyebrow")}
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1A1A1A]">
              {t("home.features.title")}
            </h2>
          </div>
        </section>
        <FeatureSection />

        <section className="pt-10 lg:pt-12 pb-10 lg:pb-12">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[#E0905A] text-xs tracking-[0.28em] uppercase font-medium mb-3">
              {t("home.catalog.eyebrow")}
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1A1A1A]">
              {t("home.catalog.title")}
            </h2>
          </div>
        </section>
        <CatalogSection />

        <ContactSection />
        <Footer />
      </div>
    </div>
  );
}

export default HomePage;
