"use client";

import { useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { PRODUCTS_PER_PAGE, type ProductItem } from "./productData";
import { useTranslation } from "../../i18n/LanguageProvider";
import type { ProductsTab } from "../../lib/productsCatalog";

interface Props {
  tabs: ProductsTab[];
  activeSlug: string;
  products: ProductItem[];
}

export default function ProductsListSection({ tabs, activeSlug, products }: Props) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  return (
    <section id="best-seller" className="pb-16 lg:pb-24 pt-10 lg:pt-12 scroll-mt-28">
      {/* Layout tabs + Best Seller — real links, each a distinct crawlable page */}
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => {
          const isActive = tab.slug === activeSlug;
          const href = tab.slug === "modern" ? "/products" : `/products/${tab.slug}`;
          return (
            <Link
              key={tab.slug}
              href={href}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
                isActive
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-[#EDE8E1] text-[#1A1A1A] hover:bg-[#E5DFD6]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Count */}
      <div className="mt-8">
        <p className="text-sm text-[#1A1A1A] font-medium">
          {t("products.count", { count: products.length })}
        </p>
      </div>

      {/* Grid */}
      {pageItems.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {pageItems.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-[#6B6B6B]">{t("products.empty")}</p>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="mt-12 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-10 h-10 rounded-full text-[#1A1A1A] disabled:opacity-30 hover:bg-[#EDE8E1] transition"
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setPage(num)}
              className={`w-10 h-10 rounded-full text-sm font-semibold transition ${
                currentPage === num
                  ? "bg-[#E0905A] text-white"
                  : "text-[#1A1A1A] hover:bg-[#EDE8E1]"
              }`}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="w-10 h-10 rounded-full text-[#1A1A1A] disabled:opacity-30 hover:bg-[#EDE8E1] transition"
          >
            →
          </button>
        </div>
      ) : null}
    </section>
  );
}
