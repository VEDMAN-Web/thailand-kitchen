"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "../i18n/LanguageProvider";
import type { Locale } from "../i18n/translations";

const languages = [
  { code: "EN" as const, label: "English", flag: "/en.png" },
  { code: "TH" as const, label: "ไทย", flag: "/thai.svg" },
  { code: "PL" as const, label: "Polski", flag: "/poland.svg" },
];

const Navbar = () => {
  const pathname = usePathname();
  const { locale, setLocale, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const selectedLanguage =
    languages.find((l) => l.code === locale) ?? languages[0];

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/products", label: t("nav.products") },
    { href: "/gallery", label: t("nav.gallery") },
    { href: "/blog", label: t("nav.blog") },
    { href: "/contact", label: t("nav.contact") },
    { href: "/faq", label: t("nav.faq") },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const selectLanguage = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      <div className="w-full px-6 sm:px-8 lg:px-10 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex-shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src="/logo1.png"
              alt="Thailand Kitchens"
              width={160}
              height={66}
              priority
              className="w-auto h-11 sm:h-12"
            />
          </Link>

          <nav className="hidden lg:flex items-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-3 py-1.5 gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm tracking-wide transition-colors duration-200 ${
                  isActive(link.href)
                    ? "bg-[#F5F3EF] text-[#1A1A1A] font-bold"
                    : "text-gray-500 font-medium hover:text-[#1A1A1A]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  searchOpen ? "w-40 opacity-100" : "w-0 opacity-0"
                }`}
              >
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("nav.search")}
                  className="w-full rounded-full border border-[#D4C4B0] bg-white px-4 py-2 text-sm outline-none shadow-md"
                />
              </div>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Toggle search"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-gray-50 transition"
              >
                <Image src="/Search.svg" alt="" width={18} height={18} />
              </button>
            </div>

            <div className="relative hidden sm:flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-2.5 bg-white hover:bg-gray-50 text-[#1A1A1A] px-4 lg:px-5 py-2.5 rounded-full font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition text-xs sm:text-sm whitespace-nowrap h-[42px]"
              >
                <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[#F5F3EF] ring-1 ring-black/5">
                  <Image
                    src={selectedLanguage.flag}
                    alt={selectedLanguage.label}
                    width={18}
                    height={18}
                    className="rounded-full object-cover"
                  />
                </span>
                <span className="tracking-normal">{selectedLanguage.label}</span>
                <Image
                  src="/Arrow-down.png"
                  alt=""
                  width={10}
                  height={10}
                  className={`${isOpen ? "rotate-180" : ""} shrink-0 opacity-70 transition-transform`}
                />
              </button>

              {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.1)] border border-black/5 overflow-hidden z-50">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => selectLanguage(language.code)}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-gray-50 transition ${
                        locale === language.code
                          ? "font-semibold text-[#1A1A1A]"
                          : "text-gray-500"
                      }`}
                    >
                      <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[#F5F3EF] ring-1 ring-black/5">
                        <Image
                          src={language.flag}
                          alt={language.label}
                          width={18}
                          height={18}
                          className="rounded-full object-cover"
                        />
                      </span>
                      <span>{language.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/contact"
              className="hidden sm:inline-flex items-center bg-white hover:bg-gray-50 text-[#1A1A1A] px-4 lg:px-5 py-2.5 rounded-full font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition text-xs sm:text-sm whitespace-nowrap h-[42px]"
            >
              {t("nav.consultation")}
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition"
            >
              <div className="flex flex-col justify-center gap-1.5 w-5">
                <span
                  className={`block h-0.5 w-5 bg-[#1A1A1A] transition-transform duration-300 ${
                    mobileOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-[#1A1A1A] transition-opacity duration-300 ${
                    mobileOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-[#1A1A1A] transition-transform duration-300 ${
                    mobileOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`lg:hidden fixed inset-x-0 top-full bg-white border-b border-black/5 shadow-lg overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-[calc(100vh-5rem)] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col px-4 sm:px-6 py-4 gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`py-3 px-4 rounded-full font-medium transition ${
                isActive(link.href)
                  ? "text-[#1A1A1A] font-bold bg-[#F5F3EF]"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="sm:hidden pt-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("nav.search")}
              className="w-full rounded-full border border-[#D4C4B0] bg-white px-4 py-2.5 text-sm outline-none shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
            />
          </div>

          <div className="sm:hidden flex gap-2 pt-2">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => selectLanguage(language.code)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold border transition bg-white ${
                  locale === language.code
                    ? "border-[#B38B6D] text-[#1A1A1A] shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                <Image
                  src={language.flag}
                  alt={language.label}
                  width={22}
                  height={16}
                  className="rounded-sm object-cover"
                />
                {language.label}
              </button>
            ))}
          </div>

          <Link
            href="/contact"
            onClick={() => setMobileOpen(false)}
            className="sm:hidden mt-2 bg-[#1A1A1A] text-white px-5 py-3 rounded-full font-semibold text-center"
          >
            {t("nav.consultation")}
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
